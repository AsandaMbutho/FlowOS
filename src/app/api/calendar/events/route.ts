import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "calendarEvents";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Calendar request failed";
}

function serialize(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title as string,
    notes: (data.notes as string | null) ?? null,
    start: (data.start as Timestamp).toDate().toISOString(),
    end: (data.end as Timestamp).toDate().toISOString(),
    allDay: Boolean(data.allDay),
    color: (data.color as string) || "#3b82f6",
  };
}

// GET /api/calendar/events?from=ISO&to=ISO
// Returns the signed-in user's events that overlap the given range.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    // A single equality filter needs no composite index; we filter the
    // date range and sort in memory since this is a personal calendar
    // (small per-user document counts).
    const snapshot = await firestore
      .collection(COLLECTION)
      .where("userId", "==", session.user.id)
      .get();

    let events = snapshot.docs.map(serialize);

    if (from && to) {
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();
      events = events.filter(
        (event) =>
          new Date(event.start).getTime() <= toTime &&
          new Date(event.end).getTime() >= fromTime,
      );
    }

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

// POST /api/calendar/events
// body: { title, notes?, start, end, allDay?, color? }
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title || !body.start || !body.end) {
      return NextResponse.json(
        { error: "title, start and end are required" },
        { status: 400 },
      );
    }

    const now = Timestamp.now();
    const docRef = await firestore.collection(COLLECTION).add({
      userId: session.user.id,
      title: body.title as string,
      notes: (body.notes as string) || null,
      start: Timestamp.fromDate(new Date(body.start)),
      end: Timestamp.fromDate(new Date(body.end)),
      allDay: Boolean(body.allDay),
      color: (body.color as string) || "#3b82f6",
      createdAt: now,
      updatedAt: now,
    });

    const created = await docRef.get();
    return NextResponse.json(
      serialize(created as FirebaseFirestore.QueryDocumentSnapshot),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 422 });
  }
}
