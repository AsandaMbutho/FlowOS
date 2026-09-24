"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { Workflow } from "@/types/workflow";
import { statusMeta } from "@/lib/workflow-style";

const DAY_WIDTH = 32; // px per day column
const ROW_HEIGHT = 40;

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function clampToMonth(date: Date, monthStart: Date, monthEnd: Date) {
  if (date < monthStart) return monthStart;
  if (date > monthEnd) return monthEnd;
  return date;
}

export function WorkflowGantt({
  workflows,
  onDueDateChange,
}: {
  workflows: Workflow[];
  onDueDateChange: (id: string, dueDate: string) => Promise<void>;
}) {
  const [cursor, setCursor] = useState(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const numDays = daysInMonth(year, month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, numDays, 23, 59, 59);
  const today = new Date();
  const todayCol =
    today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  const days = Array.from({ length: numDays }, (_, i) => i + 1);

  const rows = useMemo(() => {
    return workflows
      .map((w) => {
        const start = new Date(w.createdAt);
        const end = w.completedAt
          ? new Date(w.completedAt)
          : w.dueDateIso
            ? new Date(w.dueDateIso)
            : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Skip anything that never touches the visible month.
        if (end < monthStart || start > monthEnd) return null;

        const clippedStart = clampToMonth(start, monthStart, monthEnd);
        const clippedEnd = clampToMonth(end, monthStart, monthEnd);
        const startCol = clippedStart.getDate();
        const endCol = Math.max(startCol, clippedEnd.getDate());

        return { workflow: w, startCol, endCol };
      })
      .filter((r): r is { workflow: Workflow; startCol: number; endCol: number } => r !== null);
  }, [workflows, monthStart.getTime(), monthEnd.getTime()]);

  const navigate = (step: number) => {
    if (step === 0) {
      setCursor(new Date());
      return;
    }
    setCursor(new Date(year, month + step, 1));
  };

  const gridWidth = numDays * DAY_WIDTH;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(0)}
            className="h-8 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-8 px-3 text-sm border rounded-md hover:bg-muted transition"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="h-8 px-3 text-sm border rounded-md hover:bg-muted transition"
          >
            Next →
          </button>
        </div>
        <span className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          No workflows fall within this month.
        </div>
      ) : (
        <div className="flex overflow-x-auto">
          {/* Sticky task/owner column */}
          <div className="shrink-0 w-64 border-r bg-card sticky left-0 z-10">
            <div
              className="border-b bg-muted/40 flex items-center px-3 text-xs font-semibold text-muted-foreground"
              style={{ height: ROW_HEIGHT }}
            >
              Task
            </div>
            {rows.map(({ workflow }) => (
              <div
                key={workflow.id}
                className="flex items-center gap-2 px-3 border-b last:border-b-0"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-r ${workflow.assignee.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}
                >
                  {workflow.assignee.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-foreground truncate">
                    {workflow.title}
                  </span>
                </div>
                <label className="relative shrink-0" title="Change due date">
                  <CalendarDays className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    aria-label={`Due date for ${workflow.title}`}
                    className="h-6 w-[112px] rounded border bg-background pl-5 pr-1 text-[10px] text-foreground"
                    type="date"
                    value={workflow.dueDateIso?.slice(0, 10) ?? ""}
                    onChange={(event) => {
                      if (event.target.value) void onDueDateChange(workflow.id, event.target.value);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Day grid + bars */}
          <div style={{ width: gridWidth }} className="relative">
            {/* Day header */}
            <div
              className="grid border-b bg-muted/40"
              style={{
                gridTemplateColumns: `repeat(${numDays}, ${DAY_WIDTH}px)`,
                height: ROW_HEIGHT,
              }}
            >
              {days.map((day) => (
                <div
                  key={day}
                  className={`flex items-center justify-center text-[11px] border-r last:border-r-0 ${
                    day === todayCol
                      ? "font-bold text-[#10b981]"
                      : "text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Today marker */}
            {todayCol && (
              <div
                className="absolute top-0 bottom-0 w-px bg-[#10b981]/60 z-[1]"
                style={{ left: (todayCol - 1) * DAY_WIDTH + DAY_WIDTH / 2 }}
              />
            )}

            {/* Rows */}
            {rows.map(({ workflow, startCol, endCol }) => {
              const status = statusMeta(workflow.stage);
              const spanDays = Math.max(1, endCol - startCol + 1);
              return (
                <div
                  key={workflow.id}
                  className="relative border-b last:border-b-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Faint day gridlines */}
                  <div
                    className="absolute inset-0 grid"
                    style={{ gridTemplateColumns: `repeat(${numDays}, ${DAY_WIDTH}px)` }}
                  >
                    {days.map((day) => (
                      <div key={day} className="border-r last:border-r-0 border-border/50" />
                    ))}
                  </div>

                  {/* Bar */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-md ${status.classes.solid} opacity-90 flex items-center overflow-hidden`}
                    style={{
                      left: (startCol - 1) * DAY_WIDTH + 2,
                      width: spanDays * DAY_WIDTH - 4,
                    }}
                    title={`${workflow.title} — ${workflow.progress}%`}
                  >
                    <div
                      className="h-full bg-black/20"
                      style={{ width: `${100 - workflow.progress}%`, marginLeft: "auto" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
