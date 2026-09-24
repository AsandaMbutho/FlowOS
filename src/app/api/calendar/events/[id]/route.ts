import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "calendarEvents";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Calendar request failed";
}

function serialize(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data()!;
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

async function getOwnedDoc(id: string, userId: string) {
  const ref = firestore.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== userId) return null;
  return ref;
}

// PATCH /api/calendar/events/:id
// body: any subset of { title, notes, start, end, allDay, color }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ref = await getOwnedDoc(id, session.user.id);
    if (!ref) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();

    await ref.update({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      ...(body.start !== undefined
        ? { start: Timestamp.fromDate(new Date(body.start)) }
        : {}),
      ...(body.end !== undefined
        ? { end: Timestamp.fromDate(new Date(body.end)) }
        : {}),
      ...(body.allDay !== undefined ? { allDay: Boolean(body.allDay) } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      updatedAt: Timestamp.now(),
    });

    const updated = await ref.get();
    return NextResponse.json(serialize(updated));
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 422 });
  }
}

// DELETE /api/calendar/events/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ref = await getOwnedDoc(id, session.user.id);
  if (!ref) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ success: true });
}
