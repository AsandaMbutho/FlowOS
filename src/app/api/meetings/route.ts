import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleMeeting } from "@/lib/meeting-service";

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Meeting request failed"; }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const meetings = await db.meeting.findMany({ where: { OR: [{ organizerId: session.user.id }, { attendees: { some: { userId: session.user.id } } }] }, include: { organizer: { select: { name: true, email: true } }, attendees: true }, orderBy: { startAt: "asc" } });
  return NextResponse.json(meetings);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const idempotencyKey = request.headers.get("Idempotency-Key") || body.idempotencyKey;
    if (!idempotencyKey) return NextResponse.json({ error: "Idempotency-Key is required" }, { status: 400 });
    const meeting = await scheduleMeeting(session.user.id, { title: body.title ?? "", description: body.description, team: body.team, startAt: new Date(body.startAt), endAt: new Date(body.endAt), attendeeIds: Array.isArray(body.attendeeIds) ? body.attendeeIds : [] }, idempotencyKey);
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 422 }); }
}
