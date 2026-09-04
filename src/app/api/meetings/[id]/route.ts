import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cancelMeeting, rescheduleMeeting } from "@/lib/meeting-service";

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Meeting request failed"; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { id } = await params; const body = await request.json(); const meeting = await rescheduleMeeting(id, session.user.id, { title: body.title ?? "", description: body.description, team: body.team, startAt: new Date(body.startAt), endAt: new Date(body.endAt), attendeeIds: Array.isArray(body.attendeeIds) ? body.attendeeIds : [] }); return NextResponse.json(meeting); }
  catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 422 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { id } = await params; return NextResponse.json(await cancelMeeting(id, session.user.id)); }
  catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 422 }); }
}
