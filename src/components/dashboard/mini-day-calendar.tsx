"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  assignedDateIso: string | null;
  status: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | string;
  assigneeName?: string;
}

interface MiniDayCalendarProps {
  tasks: TaskItem[];
  onSelectTask?: (id: string) => void;
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};

export function MiniDayCalendar({ tasks, onSelectTask }: MiniDayCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const assignedWorkflowsByDay = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((t) => {
      if (!t.assignedDateIso) return;
      const key = format(parseISO(t.assignedDateIso), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [tasks]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedTasks = assignedWorkflowsByDay.get(selectedKey) ?? [];

  return (
    <section className="card-depth p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-accent" />
          Assigned Workflows
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDay(new Date());
            }}
            className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        {format(currentMonth, "MMMM yyyy")}
      </p>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = assignedWorkflowsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedDay(day)}
              className={`relative aspect-square rounded-md flex flex-col items-center justify-center text-[11px] transition-colors
                ${selected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}
                ${!inMonth ? "text-muted-foreground/30" : "text-foreground"}
              `}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full ${
                  today && !selected ? "bg-accent/20 text-accent font-semibold" : ""
                } ${today && selected ? "font-semibold" : ""}`}
              >
                {format(day, "d")}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 absolute bottom-0.5">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        PRIORITY_DOT[t.priority ?? ""] || "bg-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day task list */}
      <div className="pt-3 border-t border-border">
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          {format(selectedDay, "EEEE, d MMM")}
        </p>

        {selectedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workflows assigned.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selectedTasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelectTask?.(t.id)}
                  className="w-full text-left rounded-lg border border-border bg-muted/30 p-3 transition hover:bg-muted/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        PRIORITY_DOT[t.priority ?? ""] || "bg-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {t.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 pl-3">
                    Assigned to {t.assigneeName || "Unassigned"} · {t.status}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
