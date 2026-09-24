"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  SlotInfo,
  View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enZA } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, Trash2, X, Loader2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const locales = { "en-ZA": enZA };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarEvent = {
  id: string;
  title: string;
  notes: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
};

type RbcEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEvent;
};

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

const EMPTY_FORM = {
  id: "",
  title: "",
  notes: "",
  allDay: true,
  date: "", // yyyy-MM-dd, used when allDay
  startDateTime: "", // yyyy-MM-ddTHH:mm, used when !allDay
  endDateTime: "",
  color: COLORS[0].value,
};

function toDateInput(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function toDateTimeInput(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

// Month-view slot clicks span a full 24h day; anything shorter came from a
// timed week/day-view drag, so we use that to guess whether the user meant
// an all-day note or a timed event.
function looksAllDay(start: Date, end: Date) {
  return end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(EMPTY_FORM);

  const range = useMemo(() => {
    // Pad well beyond the visible grid so month/week/day navigation
    // rarely needs a fresh fetch.
    const from = new Date(currentDate);
    from.setDate(1);
    from.setMonth(from.getMonth() - 1);
    const to = new Date(currentDate);
    to.setMonth(to.getMonth() + 2);
    to.setDate(0);
    return { from, to };
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });
      const response = await fetch(`/api/calendar/events?${params}`);
      if (!response.ok) throw new Error("Could not load your calendar");
      setEvents(await response.json());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load your calendar",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from.getTime(), range.to.getTime()]);

  const rbcEvents: RbcEvent[] = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        allDay: event.allDay,
        resource: event,
      })),
    [events],
  );

  const openCreate = (start: Date, end: Date) => {
    const allDay = looksAllDay(start, end);
    setMode("create");
    setForm({
      ...EMPTY_FORM,
      allDay,
      date: toDateInput(start),
      startDateTime: toDateTimeInput(start),
      endDateTime: toDateTimeInput(end),
    });
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    setMode("edit");
    setForm({
      id: event.id,
      title: event.title,
      notes: event.notes || "",
      allDay: event.allDay,
      date: toDateInput(start),
      startDateTime: toDateTimeInput(start),
      endDateTime: toDateTimeInput(end),
      color: event.color,
    });
    setModalOpen(true);
  };

  const onSelectSlot = (slotInfo: SlotInfo) => openCreate(slotInfo.start, slotInfo.end);
  const onSelectEvent = (event: RbcEvent) => openEdit(event.resource);

  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };

  const buildPayload = () => {
    if (form.allDay) {
      const start = new Date(`${form.date}T00:00:00`);
      const end = new Date(`${form.date}T00:00:00`);
      end.setDate(end.getDate() + 1);
      return { start: start.toISOString(), end: end.toISOString(), allDay: true };
    }
    return {
      start: new Date(form.startDateTime).toISOString(),
      end: new Date(form.endDateTime).toISOString(),
      allDay: false,
    };
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("Give the event a title first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        notes: form.notes,
        color: form.color,
        ...buildPayload(),
      };
      const response = await fetch(
        mode === "create" ? "/api/calendar/events" : `/api/calendar/events/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save event");
      await load();
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save event");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    if (!confirm("Delete this event?")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/calendar/events/${form.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete event");
      await load();
      closeModal();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete event");
    } finally {
      setSaving(false);
    }
  };

  const eventStyleGetter = (event: RbcEvent) => ({
    style: {
      backgroundColor: event.resource.color,
      borderRadius: "6px",
      color: "white",
      padding: "2px 6px",
      fontSize: "11px",
      fontWeight: 500,
      border: "none",
    },
  });

  const formatViewLabel = () => {
    if (currentView === "month") return format(currentDate, "MMMM yyyy");
    if (currentView === "week") {
      const start = startOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  const navigate = (action: "TODAY" | "PREV" | "NEXT") => {
    if (action === "TODAY") {
      setCurrentDate(new Date());
      return;
    }
    const next = new Date(currentDate);
    const step = action === "PREV" ? -1 : 1;
    if (currentView === "month") next.setMonth(next.getMonth() + step);
    else if (currentView === "week") next.setDate(next.getDate() + step * 7);
    else next.setDate(next.getDate() + step);
    setCurrentDate(next);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Your personal events and notes, day by day.
          </p>
        </div>
        <Button onClick={() => openCreate(new Date(), new Date(Date.now() + 60 * 60 * 1000))}>
          <Plus className="mr-2 h-4 w-4" />
          New event
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 mb-4 p-3 bg-muted rounded-lg border sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("TODAY")}
              className="h-8 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => navigate("PREV")}
              className="h-8 px-3 text-sm border rounded-md hover:bg-muted transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => navigate("NEXT")}
              className="h-8 px-3 text-sm border rounded-md hover:bg-muted transition"
            >
              Next →
            </button>
          </div>

          <span className="min-w-0 text-sm font-semibold sm:text-center sm:text-base lg:text-lg">
            {formatViewLabel()}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {(["month", "week", "day"] as View[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCurrentView(view)}
                className={`h-8 px-3 text-sm capitalize rounded-md transition ${
                  currentView === view
                    ? "bg-blue-600 text-white"
                    : "border hover:bg-muted"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {error && !modalOpen && (
          <p className="mb-3 rounded bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="h-[600px] w-full min-w-0 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <Calendar
            localizer={localizer}
            events={rbcEvents}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={(date: Date) => setCurrentDate(date)}
            view={currentView}
            onView={(view: View) => setCurrentView(view)}
            views={["month", "week", "day"]}
            style={{ height: "100%" }}
            eventPropGetter={eventStyleGetter}
            selectable
            popup
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectEvent}
            toolbar={false}
            formats={{
              monthHeaderFormat: "MMMM yyyy",
              weekdayFormat: "EEEE",
              dayFormat: "EEEE MMM d",
            }}
          />
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                {mode === "create" ? "New event" : "Edit event"}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  autoFocus
                  placeholder="Event or note title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                />
                All day / note (no specific time)
              </label>

              {form.allDay ? (
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="datetime-local"
                      value={form.startDateTime}
                      onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="datetime-local"
                      value={form.endDateTime}
                      onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any details you want to keep with this day..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setForm({ ...form, color: c.value })}
                      className={`h-6 w-6 rounded-full border-2 ${
                        form.color === c.value ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {mode === "edit" ? (
                <Button variant="outline" onClick={remove} disabled={saving}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
