"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Stage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
type Status = "To Do" | "In Progress" | "Review" | "Completed" | "Blocked";

interface Assignee {
  name: string;
  initials: string;
  color: string;
}

interface Workflow {
  id: string;
  title: string;
  description: string;
  team: string;
  stage: Stage;
  status: Status;
  priority: Priority;
  progress: number;
  tasksLeft: number;
  tags: string[];
  assignee: Assignee;
  dueDate: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMNS: {
  stage: Stage;
  label: Status;
  color: string;
  bg: string;
  border: string;
  dot: string;
}[] = [
  {
    stage: "TODO",
    label: "To Do",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    dot: "bg-gray-400",
  },
  {
    stage: "IN_PROGRESS",
    label: "In Progress",
    color: "text-[#0f1f3d]",
    bg: "bg-[#f0fdf9]",
    border: "border-[#a7f3d0]",
    dot: "bg-[#10b981]",
  },
  {
    stage: "REVIEW",
    label: "Review",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  {
    stage: "DONE",
    label: "Completed",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  {
    stage: "BLOCKED",
    label: "Blocked",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
];

const PRIORITY_CFG: Record<
  Priority,
  { bg: string; text: string; border: string }
> = {
  HIGH: { bg: "bg-red-100", text: "text-red-700", border: "border-l-red-500" },
  MEDIUM: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-l-yellow-500",
  },
  LOW: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-l-green-500",
  },
};

const STATUS_TO_STAGE: Record<Status, Stage> = {
  "To Do": "TODO",
  "In Progress": "IN_PROGRESS",
  Review: "REVIEW",
  Completed: "DONE",
  Blocked: "BLOCKED",
};

const progressColor = (p: number) =>
  p === 100
    ? "bg-green-500"
    : p >= 70
      ? "bg-[#10b981]"
      : p >= 40
        ? "bg-yellow-500"
        : "bg-red-400";

// ─── Card component ───────────────────────────────────────────────────────────

function KanbanCard({
  workflow,
  onDragStart,
  onClick,
}: {
  workflow: Workflow;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (id: string) => void;
}) {
  const p = PRIORITY_CFG[workflow.priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, workflow.id)}
      onClick={() => onClick(workflow.id)}
      className={`bg-card rounded-xl border-l-4 border ${p.border} p-4 cursor-pointer hover:shadow-md active:opacity-60 transition-all select-none group`}
    >
      {/* Drag handle hint */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground leading-snug mb-1">
            {workflow.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate mb-2">
            {workflow.description}
          </p>

          {/* Priority badge */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.bg} ${p.text}`}
            >
              {workflow.priority.charAt(0) +
                workflow.priority.slice(1).toLowerCase()}
            </span>
            {workflow.dueDate === "Overdue" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                Overdue
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{workflow.team}</span>
              <span className="font-medium text-muted-foreground">
                {workflow.progress}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div
                className={`h-1 rounded-full ${progressColor(workflow.progress)}`}
                style={{ width: `${workflow.progress}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-r ${workflow.assignee.color} flex items-center justify-center text-white text-xs font-bold`}
              >
                {workflow.assignee.initials}
              </div>
              <span className="text-xs text-muted-foreground">
                {workflow.assignee.name}
              </span>
            </div>
            {workflow.dueDate !== "Overdue" && (
              <span className="text-xs text-muted-foreground">{workflow.dueDate}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Column component ─────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  workflows,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  onCardClick,
}: {
  col: (typeof COLUMNS)[number];
  workflows: Workflow[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, stage: Stage) => void;
  onDragOver: (e: React.DragEvent, stage: Stage) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
  onCardClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Column header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${col.bg} border ${col.border}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <span className={`text-sm font-semibold ${col.color}`}>
            {col.label}
          </span>
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}
        >
          {workflows.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={(e) => onDrop(e, col.stage)}
        onDragOver={(e) => onDragOver(e, col.stage)}
        onDragLeave={onDragLeave}
        className={`flex-1 rounded-xl transition-all min-h-[200px] space-y-3 p-2 border-2 border-dashed ${
          isDragOver
            ? "border-blue-400 bg-[#f0fdf9]/50 scale-[1.01]"
            : "border-transparent"
        }`}
      >
        {workflows.map((w) => (
          <KanbanCard
            key={w.id}
            workflow={w}
            onDragStart={onDragStart}
            onClick={onCardClick}
          />
        ))}
        {workflows.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const dragId = useRef<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error();
      setWorkflows(await res.json());
    } catch {
      setError("Failed to load workflows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = async (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = dragId.current;
    if (!id) return;

    const workflow = workflows.find((w) => w.id === id);
    if (!workflow || workflow.stage === stage) return;

    // Optimistic update
    const stageToStatus: Record<Stage, Status> = {
      TODO: "To Do",
      IN_PROGRESS: "In Progress",
      REVIEW: "Review",
      DONE: "Completed",
      BLOCKED: "Blocked",
    };
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, stage, status: stageToStatus[stage] } : w,
      ),
    );

    // Persist to DB
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, stage: workflow.stage, status: workflow.status }
            : w,
        ),
      );
      alert("Failed to update workflow stage.");
    }

    dragId.current = null;
  };

  const total = workflows.length;
  const inProgress = workflows.filter((w) => w.stage === "IN_PROGRESS").length;
  const blocked = workflows.filter((w) => w.stage === "BLOCKED").length;
  const done = workflows.filter((w) => w.stage === "DONE").length;

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchWorkflows} variant="outline">
          Retry
        </Button>
      </div>
    );

  return (
    <div className="p-6 space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag and drop workflows to update their status
          </p>
        </div>
        <Button
          className="bg-[#0f1f3d] hover:bg-[#10b981]"
          onClick={() => router.push("/workflows")}
        >
          <Plus className="w-4 h-4 mr-2" /> New Workflow
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        {[
          {
            label: "Total",
            val: total,
            color: "text-muted-foreground",
            bg: "bg-muted",
          },
          {
            label: "In Progress",
            val: inProgress,
            color: "text-[#0f1f3d]",
            bg: "bg-[#d1fae5]",
          },
          {
            label: "Blocked",
            val: blocked,
            color: "text-red-700",
            bg: "bg-red-100",
          },
          {
            label: "Completed",
            val: done,
            color: "text-green-700",
            bg: "bg-green-100",
          },
        ].map(({ label, val, color, bg }) => (
          <div
            key={label}
            className="bg-card border rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div
              className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}
            >
              <span className={`text-sm font-bold ${color}`}>{val}</span>
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.stage}
            col={col}
            workflows={workflows.filter((w) => w.stage === col.stage)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            isDragOver={dragOverStage === col.stage}
            onCardClick={(id) => router.push(`/workflows/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}
