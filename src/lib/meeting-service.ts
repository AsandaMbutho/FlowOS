// @ts-nocheck
import { MeetingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  assertCalendarAvailability,
  cancelCalendarMeeting,
  createCalendarMeeting,
  findCalendarMeeting,
  meetUrl,
  updateCalendarMeeting,
} from "@/lib/google-calendar";

type MeetingInput = {
  title: string;
  description?: string;
  team?: string;
  startAt: Date;
  endAt: Date;
  attendeeIds: string[];
};
const include = {
  organizer: { select: { id: true, name: true, email: true } },
  attendees: true,
} as const;

function validate(input: MeetingInput) {
  if (!input.title.trim()) throw new Error("Meeting title is required");
  if (input.endAt <= input.startAt)
    throw new Error("End time must be after start time");
  if (input.startAt <= new Date())
    throw new Error("Meeting must be scheduled in the future");
}

async function notify(meeting: {
  title: string;
  startAt: Date;
  status: MeetingStatus;
  googleMeetUrl: string | null;
  attendees: Array<{ email: string }>;
}) {
  const action =
    meeting.status === "CANCELLED" ? "cancelled" : "scheduled or updated";
  const deliveries = await Promise.allSettled(
    meeting.attendees.map((attendee) =>
      sendEmail({
        to: attendee.email,
        subject: `FlowOS meeting ${action}: ${meeting.title}`,
        html: `<p>Your FlowOS meeting <strong>${meeting.title}</strong> has been ${action}.</p><p><strong>When:</strong> ${meeting.startAt.toLocaleString()}</p>${meeting.googleMeetUrl ? `<p><a href="${meeting.googleMeetUrl}">Join Google Meet</a></p>` : ""}`,
        text: `Meeting ${action}: ${meeting.title}. When: ${meeting.startAt.toLocaleString()}${meeting.googleMeetUrl ? `. Join: ${meeting.googleMeetUrl}` : ""}`,
      }),
    ),
  );
  return deliveries.filter((delivery) => delivery.status === "rejected").length;
}

export async function scheduleMeeting(
  organizerId: string,
  input: MeetingInput,
  idempotencyKey: string,
) {
  validate(input);
  const account = await db.googleAccount.findUnique({
    where: { userId: organizerId },
  });
  if (!account)
    throw new Error(
      "Connect the organizer's Google Calendar before scheduling a meeting",
    );
  const existing = await db.meeting.findUnique({
    where: { idempotencyKey },
    include,
  });
  if (existing && existing.status !== "FAILED") return existing;
  const users = await db.user.findMany({
    where: {
      id: {
        in: [...new Set(input.attendeeIds)].filter((id) => id !== organizerId),
      },
    },
    select: { id: true, email: true, name: true },
  });
  const meeting =
    existing ??
    (await db.meeting.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        team: input.team,
        startAt: input.startAt,
        endAt: input.endAt,
        organizerId,
        googleAccountId: account.id,
        idempotencyKey,
        attendees: {
          create: users.map((user) => ({
            userId: user.id,
            email: user.email,
            name: user.name,
          })),
        },
      },
      include,
    }));
  try {
    await assertCalendarAvailability(
      account.id,
      meeting.startAt,
      meeting.endAt,
    );
    const event =
      (await findCalendarMeeting(account.id, meeting.id)) ??
      (await createCalendarMeeting(account.id, meeting, meeting.attendees));
    const synced = await db.meeting.update({
      where: { id: meeting.id },
      data: {
        status: "SCHEDULED",
        googleCalendarEventId: event.id,
        googleMeetUrl: meetUrl(event),
        syncError: null,
        lastSyncedAt: new Date(),
      },
      include,
    });
    await notify(synced);
    return synced;
  } catch (error) {
    await db.meeting.update({
      where: { id: meeting.id },
      data: {
        status: "FAILED",
        syncError:
          error instanceof Error
            ? error.message
            : "Calendar synchronization failed",
      },
    });
    throw error;
  }
}

export async function rescheduleMeeting(
  meetingId: string,
  organizerId: string,
  input: MeetingInput,
) {
  validate(input);
  const existing = await db.meeting.findFirst({
    where: { id: meetingId, organizerId, status: "SCHEDULED" },
    include,
  });
  if (!existing?.googleCalendarEventId)
    throw new Error("Scheduled meeting not found");
  const users = await db.user.findMany({
    where: {
      id: {
        in: [...new Set(input.attendeeIds)].filter((id) => id !== organizerId),
      },
    },
    select: { id: true, email: true, name: true },
  });
  // The existing event is itself returned by Google's free/busy endpoint.
  // Updating it directly preserves the Meet conference without treating that
  // event as a conflicting booking.
  const draft = {
    ...existing,
    ...input,
    description: input.description?.trim() || null,
    title: input.title.trim(),
    attendees: users,
  };
  const event = await updateCalendarMeeting(
    existing.googleAccountId,
    existing.googleCalendarEventId,
    draft,
    users,
  );
  const updated = await db.$transaction(async (tx) => {
    await tx.meetingAttendee.deleteMany({ where: { meetingId } });
    return tx.meeting.update({
      where: { id: meetingId },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        team: input.team,
        startAt: input.startAt,
        endAt: input.endAt,
        googleMeetUrl: meetUrl(event) ?? existing.googleMeetUrl,
        syncError: null,
        lastSyncedAt: new Date(),
        attendees: {
          create: users.map((user) => ({
            userId: user.id,
            email: user.email,
            name: user.name,
          })),
        },
      },
      include,
    });
  });
  await notify(updated);
  return updated;
}

export async function cancelMeeting(meetingId: string, organizerId: string) {
  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, organizerId, status: "SCHEDULED" },
    include,
  });
  if (!meeting?.googleCalendarEventId)
    throw new Error("Scheduled meeting not found");
  await cancelCalendarMeeting(
    meeting.googleAccountId,
    meeting.googleCalendarEventId,
  );
  const cancelled = await db.meeting.update({
    where: { id: meetingId },
    data: { status: "CANCELLED", lastSyncedAt: new Date(), syncError: null },
    include,
  });
  await notify(cancelled);
  return cancelled;
}
