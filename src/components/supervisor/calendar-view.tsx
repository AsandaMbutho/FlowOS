"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enZA } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

function parseWorkflowDate(dateIso?: string | null): Date | null {
  if (dateIso) {
    const date = new Date(dateIso);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function CalendarView({ workflows }: { workflows: any[] }) {
  // FIXED: Use today's date instead of hardcoded April 28
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
    "month",
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const mappedEvents = workflows
      .filter((workflow) => workflow.assignedDateIso || workflow.createdAt)
      .map((workflow) => {
        const parsedDate = parseWorkflowDate(
          workflow.assignedDateIso ?? workflow.createdAt,
        );
        if (!parsedDate) return null;
        return {
          id: workflow.id,
          title: `${workflow.title} - ${workflow.assignee?.name || "Unassigned"}`,
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
      setCurrentDate(new Date());
    } else if (action === "PREV") {
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      setCurrentDate(newDate);
    } else if (action === "NEXT") {
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === "week") {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      setCurrentDate(newDate);
    }
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

  const eventStyleGetter = (event: CalendarEvent) => {
    const isCompleted = event.resource?.progress === 100;
    const isHighPriority = event.resource?.priority === "HIGH";

    let backgroundColor = "#3b82f6";

    if (isCompleted) {
      backgroundColor = "#10b981";
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
    <div className="h-[550px] w-full min-w-0">
      {/* Custom Toolbar */}
      <div className="flex flex-col gap-3 mb-4 p-3 bg-muted rounded-lg border sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate("TODAY")}
            className="h-8 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("PREV")}
            className="h-8 px-3 text-sm border rounded-md hover:bg-muted transition"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("NEXT")}
            className="h-8 px-3 text-sm border rounded-md hover:bg-muted transition"
          >
            Next →
          </button>
        </div>

        <span className="min-w-0 text-sm font-semibold sm:text-center sm:text-base lg:text-lg">
          {formatViewLabel()}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentView("month")}
            className={`h-8 px-3 text-sm capitalize rounded-md transition ${
              currentView === "month"
                ? "bg-blue-600 text-white"
                : "border hover:bg-muted"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("week")}
            className={`h-8 px-3 text-sm capitalize rounded-md transition ${
              currentView === "week"
                ? "bg-blue-600 text-white"
                : "border hover:bg-muted"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("day")}
            className={`h-8 px-3 text-sm capitalize rounded-md transition ${
              currentView === "day"
                ? "bg-blue-600 text-white"
                : "border hover:bg-muted"
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
              <span className="text-xs">Assigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs">High Priority Assignment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs">Needs Attention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs">Completed</span>
        </div>
      </div>
    </div>
  );
}
