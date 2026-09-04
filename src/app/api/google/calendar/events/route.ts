import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { listUpcomingCalendarEvents } from "@/lib/google-calendar";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await db.googleAccount.findUnique({
    where: { userId: session.user.id },
    select: { id: true, googleEmail: true },
  });

  if (!account) {
    return NextResponse.json(
      { connected: false, events: [] },
      { status: 200 },
    );
  }

  try {
    const events = await listUpcomingCalendarEvents(account.id, 10);

    return NextResponse.json({
      connected: true,
      googleEmail: account.googleEmail,
      events,
    });
  } catch (error) {
    console.error("Failed to fetch Google Calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch Google Calendar events" },
      { status: 502 },
    );
  }
}
