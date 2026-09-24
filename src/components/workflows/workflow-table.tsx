"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Eye } from "lucide-react";
import type { Workflow } from "@/types/workflow";
import { statusMeta, PRIORITY_META } from "@/lib/workflow-style";

type Group = {
  id: string;
  label: string;
  barColor: string;
  workflows: Workflow[];
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Buckets workflows the way Monday's default board groups items:
// overdue first, then this month, next month, later, no date, and
// completed items collapsed at the bottom out of the way.
function groupWorkflows(workflows: Workflow[]): Group[] {
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const nextMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 1);
  const monthAfter = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 2, 1);

  const buckets: Record<string, Workflow[]> = {
    overdue: [],
    thisMonth: [],
    nextMonth: [],
    later: [],
    noDate: [],
    completed: [],
  };

  for (const w of workflows) {
    if (w.progress === 100) {
      buckets.completed.push(w);
      continue;
    }
    if (!w.dueDateIso) {
      buckets.noDate.push(w);
      continue;
    }
    const due = new Date(w.dueDateIso);
    if (due < now) buckets.overdue.push(w);
    else if (due < nextMonth) buckets.thisMonth.push(w);
    else if (due < monthAfter) buckets.nextMonth.push(w);
    else buckets.later.push(w);
  }

  const groups: Group[] = [
    { id: "overdue", label: "Overdue", barColor: "bg-rose-600", workflows: buckets.overdue },
    { id: "thisMonth", label: "This Month", barColor: "bg-teal-600", workflows: buckets.thisMonth },
    { id: "nextMonth", label: "Next Month", barColor: "bg-indigo-500", workflows: buckets.nextMonth },
    { id: "later", label: "Later", barColor: "bg-slate-500", workflows: buckets.later },
    { id: "noDate", label: "No Due Date", barColor: "bg-gray-400", workflows: buckets.noDate },
    { id: "completed", label: "Completed", barColor: "bg-emerald-600", workflows: buckets.completed },
  ];

  return groups.filter((g) => g.workflows.length > 0);
}

export function WorkflowTable({
  workflows,
  onRowClick,
  onMarkComplete,
}: {
  workflows: Workflow[];
  onRowClick: (id: string) => void;
  onMarkComplete: (id: string) => Promise<void>;
}) {
  const groups = useMemo(() => groupWorkflows(workflows), [workflows]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  if (workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No workflows yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Column header, shown once above every group */}
      <div className="grid grid-cols-[1fr_160px_180px_150px_130px_104px] items-center gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/40 border-b">
        <span>Task</span>
        <span>Owner</span>
        <span>Timeline</span>
        <span>Status</span>
        <span>Priority</span>
        <span className="text-right">Actions</span>
      </div>

      {groups.map((group) => {
        const isCollapsed = collapsed[group.id];
        return (
          <div key={group.id}>
            <button
              onClick={() => toggle(group.id)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition border-b"
            >
              <span className={`h-3 w-1.5 rounded-full ${group.barColor}`} />
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {group.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {group.workflows.length}
              </span>
            </button>

            {!isCollapsed &&
              group.workflows.map((w) => {
                const status = statusMeta(w.stage);
                const priority = PRIORITY_META[w.priority];
                return (
                  <div
                    key={w.id}
                    onClick={() => onRowClick(w.id)}
                    className="grid grid-cols-[1fr_160px_180px_150px_130px_104px] items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/20 cursor-pointer transition"
                  >
                    {/* Task */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {w.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {w.team}
                      </p>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${w.assignee.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                      >
                        {w.assignee.initials}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {w.assignee.name}
                      </span>
                    </div>

                    {/* Timeline (progress-driven, colored by status) */}
                    <div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${status.classes.solid}`}
                          style={{ width: `${w.progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {w.progress}% · {w.dueDate}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${status.classes.soft} ${status.classes.text}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Priority */}
                    <div>
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${priority.bg} ${priority.text}`}
                      >
                        {priority.label}
                      </span>
                    </div>

                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`View ${w.title}`}
                        title="View workflow"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRowClick(w.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Mark ${w.title} complete`}
                        title={w.stage === "DONE" ? "Completed" : "Mark complete"}
                        disabled={w.stage === "DONE"}
                        onClick={(event) => {
                          event.stopPropagation();
                          void onMarkComplete(w.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:cursor-default disabled:opacity-45"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
