"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enZA } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Event, stringOrDate } from "react-big-calendar";

const locales = {
  "en-ZA": enZA,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    assignee: string;
    progress: number;
    status: string;
    priority: string;
  };
}

function parseDueDate(dueDate: any): Date | null {
  if (!dueDate) return null;
  if (dueDate === "Overdue") return new Date(2026, 3, 25);
  if (dueDate === "Today") return new Date(2026, 3, 28);
  if (dueDate === "Thursday") return new Date(2026, 4, 1);
  if (dueDate === "Friday") return new Date(2026, 4, 1);

  try {
    const date = new Date(dueDate);
    if (!isNaN(date.getTime())) return date;
  } catch (e) {}

  return new Date(2026, 3, 28);
}

export function CalendarView({ workflows }: { workflows: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 28));
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
    "month",
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const mappedEvents = workflows
      .filter((workflow) => workflow.dueDate)
      .map((workflow) => {
        const parsedDate = parseDueDate(workflow.dueDate);
        if (!parsedDate) return null;
        return {
          id: workflow.id,
          title: workflow.title,
          start: parsedDate,
          end: parsedDate,
          resource: {
            assignee: workflow.assignee?.name || "Unassigned",
            progress: workflow.progress,
            status: workflow.status,
            priority: workflow.priority,
          },
        };
      })
      .filter(Boolean) as CalendarEvent[];
    setEvents(mappedEvents);
  }, [workflows]);

  const handleNavigate = (action: "TODAY" | "PREV" | "NEXT") => {
    const newDate = new Date(currentDate);
    if (action === "TODAY") {
      newDate.setDate(28);
    } else if (action === "PREV") {
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else if (action === "NEXT") {
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const formatViewLabel = () => {
    if (currentView === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (currentView === "week") {
      const start = startOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    }
  };

  const eventStyleGetter = (
    event: CalendarEvent,
  ): { style: React.CSSProperties } => {
    const today = new Date(2026, 3, 28);
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);

    const isOverdue = eventDate < today && event.resource?.progress !== 100;
    const isCompleted = event.resource?.progress === 100;
    const isHighPriority = event.resource?.priority === "HIGH";

    let backgroundColor = "#3b82f6";

    if (isCompleted) {
      backgroundColor = "#10b981";
    } else if (isOverdue) {
      backgroundColor = "#ef4444";
    } else if (isHighPriority) {
      backgroundColor = "#f59e0b";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        color: "white",
        padding: "2px 4px",
        fontSize: "11px",
        fontWeight: "500",
        border: "none",
        cursor: "pointer",
      },
    };
  };

  const onSelectEvent = (event: CalendarEvent) => {
    window.location.href = `/workflows/${event.id}`;
  };

  return (
    <div className="h-[550px] w-full">
      {/* Custom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate("TODAY")}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Today
          </button>
          <button
            onClick={() => handleNavigate("PREV")}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 transition"
          >
            ← Back
          </button>
          <button
            onClick={() => handleNavigate("NEXT")}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 transition"
          >
            Next →
          </button>
        </div>

        <span className="text-lg font-semibold">{formatViewLabel()}</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView("month")}
            className={`px-3 py-1.5 text-sm capitalize rounded-md transition ${
              currentView === "month"
                ? "bg-blue-600 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setCurrentView("week")}
            className={`px-3 py-1.5 text-sm capitalize rounded-md transition ${
              currentView === "week"
                ? "bg-blue-600 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView("day")}
            className={`px-3 py-1.5 text-sm capitalize rounded-md transition ${
              currentView === "day"
                ? "bg-blue-600 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Component */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={(date: Date) => setCurrentDate(date)}
        view={currentView}
        onView={(view: string) =>
          setCurrentView(view as "month" | "week" | "day")
        }
        style={{ height: "calc(100% - 60px)" }}
        eventPropGetter={eventStyleGetter}
        views={["month", "week", "day"]}
        popup
        onSelectEvent={onSelectEvent}
        toolbar={false}
        formats={{
          monthHeaderFormat: "MMMM yyyy",
          weekdayFormat: "EEEE",
          dayFormat: "EEEE MMM d",
        }}
      />

      <div className="flex flex-wrap gap-4 mt-4 pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs">Completed</span>
        </div>
      </div>
    </div>
  );
}
