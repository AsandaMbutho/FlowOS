import { db } from "@/lib/db";

type CalendarEvent = {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
};

export type UpcomingCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string | null;
  htmlLink: string | null;
  location: string | null;
};

async function accessToken(accountId: string) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.expiresAt || account.expiresAt.getTime() > Date.now() + 60_000) return account;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google token refresh failed: ${await response.text()}`);
  const token = await response.json() as { access_token: string; expires_in?: number };
  return db.googleAccount.update({
    where: { id: account.id },
    data: { accessToken: token.access_token, expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000) },
  });
}

async function googleFetch(accountId: string, path: string, init: RequestInit = {}) {
  const account = await accessToken(accountId);
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${account.accessToken}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw new Error(`Google Calendar request failed (${response.status}): ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

export async function assertCalendarAvailability(accountId: string, startAt: Date, endAt: Date) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  const data = await googleFetch(accountId, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: startAt.toISOString(), timeMax: endAt.toISOString(), items: [{ id: account.calendarId }] }),
  }) as { calendars?: Record<string, { busy?: unknown[] }> };
  const busy = data.calendars?.[account.calendarId]?.busy ?? [];
  if (busy.length) throw new Error("Organizer is unavailable at the requested time");
}

function eventPayload(meeting: { id: string; title: string; description: string | null; startAt: Date; endAt: Date }, attendees: Array<{ email: string }>) {
  return {
    summary: meeting.title,
    description: meeting.description ?? undefined,
    start: { dateTime: meeting.startAt.toISOString() },
    end: { dateTime: meeting.endAt.toISOString() },
    attendees: attendees.map(({ email }) => ({ email })),
    conferenceData: { createRequest: { requestId: `flowos-meeting-${meeting.id}`, conferenceSolutionKey: { type: "hangoutsMeet" } } },
    extendedProperties: { private: { flowosMeetingId: meeting.id } },
  };
}

export async function createCalendarMeeting(accountId: string, meeting: Parameters<typeof eventPayload>[0], attendees: Array<{ email: string }>) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  return googleFetch(accountId, `/calendars/${encodeURIComponent(account.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST", body: JSON.stringify(eventPayload(meeting, attendees)),
  }) as Promise<CalendarEvent>;
}

// Recovery lookup for a request that reached Google but failed before FlowOS
// could persist the returned event ID. The private FlowOS ID makes retries safe.
export async function findCalendarMeeting(accountId: string, meetingId: string) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  const query = new URLSearchParams({ privateExtendedProperty: `flowosMeetingId=${meetingId}`, singleEvents: "true", maxResults: "1" });
  const data = await googleFetch(accountId, `/calendars/${encodeURIComponent(account.calendarId)}/events?${query}`) as { items?: CalendarEvent[] };
  return data.items?.[0] ?? null;
}

export async function updateCalendarMeeting(accountId: string, eventId: string, meeting: Parameters<typeof eventPayload>[0], attendees: Array<{ email: string }>) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  return googleFetch(accountId, `/calendars/${encodeURIComponent(account.calendarId)}/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1&sendUpdates=all`, {
    method: "PATCH", body: JSON.stringify(eventPayload(meeting, attendees)),
  }) as Promise<CalendarEvent>;
}

export async function cancelCalendarMeeting(accountId: string, eventId: string) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  await googleFetch(accountId, `/calendars/${encodeURIComponent(account.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: "DELETE" });
}

export async function listUpcomingCalendarEvents(accountId: string, maxResults = 10) {
  const account = await db.googleAccount.findUniqueOrThrow({ where: { id: accountId } });
  const query = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });
  const data = (await googleFetch(
    accountId,
    `/calendars/${encodeURIComponent(account.calendarId)}/events?${query}`,
  )) as {
    items?: Array<{
      id?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      htmlLink?: string;
      location?: string;
    }>;
  };

  return (data.items ?? [])
    .filter((event) => event.id && (event.start?.dateTime || event.start?.date))
    .map((event) => ({
      id: event.id!,
      summary: event.summary || "Untitled event",
      start: event.start!.dateTime ?? event.start!.date!,
      end: event.end?.dateTime ?? event.end?.date ?? null,
      htmlLink: event.htmlLink ?? null,
      location: event.location ?? null,
    })) satisfies UpcomingCalendarEvent[];
}

export function meetUrl(event: CalendarEvent) {
  return event.hangoutLink ?? event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ?? null;
}
