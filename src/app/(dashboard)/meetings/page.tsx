"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarCheck, ExternalLink, Loader2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type User = { id: string; name: string | null; email: string };
type Meeting = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: "PENDING" | "SCHEDULED" | "CANCELLED" | "FAILED";
  googleCalendarEventId: string | null;
  googleMeetUrl: string | null;
  syncError: string | null;
  organizer: { name: string | null; email: string };
  attendees: Array<{ id: string; name: string | null; email: string }>;
};

const ATTENDEE_NAME_OVERRIDES: Record<string, string> = {
  "Lutendo Matshidze": "Lutendo",
  "Matlhodi Moila": "Matlhodi",
};

const HIDDEN_ATTENDEES = new Set(["Test User"]);

function attendeeName(user: Pick<User, "name" | "email">) {
  const name = user.name?.trim();
  if (!name) return user.email;
  return ATTENDEE_NAME_OVERRIDES[name] ?? name;
}

function isMeetingAttendee(user: User) {
  const name = user.name?.trim();
  return !name || !HIDDEN_ATTENDEES.has(name);
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    attendeeIds: [] as string[],
  });

  const attendees = users.filter(isMeetingAttendee);

  const load = async () => {
    setLoading(true);
    const [meetingResponse, userResponse] = await Promise.all([
      fetch("/api/meetings"),
      fetch("/api/users"),
    ]);

    if (meetingResponse.ok) setMeetings(await meetingResponse.json());
    if (userResponse.ok) setUsers(await userResponse.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const schedule = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setForm({
        title: "",
        description: "",
        startAt: "",
        endAt: "",
        attendeeIds: [],
      });
      await load();
    } catch (scheduleError) {
      setError(
        scheduleError instanceof Error
          ? scheduleError.message
          : "Could not schedule meeting",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancel this meeting and notify attendees?")) return;

    const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Could not cancel meeting");
      return;
    }

    await load();
  };

  const toggleAttendee = (id: string) =>
    setForm((current) => ({
      ...current,
      attendeeIds: current.attendeeIds.includes(id)
        ? current.attendeeIds.filter((value) => value !== id)
        : [...current.attendeeIds, id],
    }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">
            Schedule one meeting that synchronizes Google Calendar and Google
            Meet.
          </p>
        </div>
        <Button asChild>
          <a href="/api/google/calendar/connect">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Connect Google Calendar
          </a>
        </Button>
      </div>

      <form
        onSubmit={schedule}
        className="rounded-xl border bg-card p-5 space-y-4"
      >
        <h2 className="font-semibold">Schedule meeting</h2>
        {error && (
          <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            required
            placeholder="Meeting title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="text-sm">
            Start
            <Input
              required
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
          </label>
          <label className="text-sm">
            End
            <Input
              required
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Attendees</p>
          <div className="flex flex-wrap gap-2">
            {attendees.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.attendeeIds.includes(user.id)}
                  onChange={() => toggleAttendee(user.id)}
                />
                {attendeeName(user)}
              </label>
            ))}
          </div>
        </div>
        <Button disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Schedule meeting
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Scheduled meetings</h2>
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : meetings.length === 0 ? (
          <p className="text-muted-foreground">No meetings scheduled yet.</p>
        ) : (
          meetings.map((meeting) => (
            <article key={meeting.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(meeting.startAt).toLocaleString()} -{" "}
                    {new Date(meeting.endAt).toLocaleTimeString()}
                  </p>
                  <p className="mt-2 text-sm">
                    Attendees:{" "}
                    {meeting.attendees
                      .filter(isMeetingAttendee)
                      .map((attendee) => attendeeName(attendee))
                      .join(", ") || "None"}
                  </p>
                  {meeting.syncError && (
                    <p className="mt-2 text-sm text-destructive">
                      Sync issue: {meeting.syncError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {meeting.googleMeetUrl && (
                    <Button size="sm" asChild>
                      <a href={meeting.googleMeetUrl} target="_blank">
                        <Video className="mr-2 h-4 w-4" />
                        Join Meet
                      </a>
                    </Button>
                  )}
                  {meeting.status === "SCHEDULED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancel(meeting.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              {meeting.googleCalendarEventId && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Google Calendar event: {meeting.googleCalendarEventId}{" "}
                  <ExternalLink className="inline h-3 w-3" />
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
