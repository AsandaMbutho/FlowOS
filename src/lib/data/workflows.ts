import { Workflow } from "@/data/workflows";
import { cn } from "@/lib/utils";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "In Progress": {
    dot: "bg-blue-400",
    label: "In Progress",
    badge: "bg-blue-500/15 text-blue-300",
  },
  Review: {
    dot: "bg-amber-400",
    label: "Review",
    badge: "bg-amber-500/15 text-amber-300",
  },
  Blocked: {
    dot: "bg-red-400",
    label: "Blocked",
    badge: "bg-red-500/15 text-red-300",
  },
  Completed: {
    dot: "bg-[#00C48C]",
    label: "Completed",
    badge: "bg-[#00C48C]/15 text-[#00C48C]",
  },
  "To Do": {
    dot: "bg-white/30",
    label: "To Do",
    badge: "bg-white/10 text-white/50",
  },
} as const;

// ── Priority config ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  HIGH: { label: "High", classes: "bg-red-500/15 text-red-400" },
  MEDIUM: { label: "Medium", classes: "bg-amber-500/15 text-amber-400" },
  LOW: { label: "Low", classes: "bg-white/8 text-white/35" },
} as const;

// ── Progress bar colour ───────────────────────────────────────────────────────
function progressColor(progress: number) {
  if (progress === 100) return "bg-[#00C48C]";
  if (progress >= 60) return "bg-[#00C48C]";
  if (progress >= 30) return "bg-amber-400";
  return "bg-red-400";
}

interface WorkflowCardProps {
  workflow: Workflow;
  onClick?: () => void;
}

export function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  const statusCfg = STATUS_CONFIG[workflow.status];
  const priorityCfg = PRIORITY_CONFIG[workflow.priority];

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#0D1B4B]/12"
    >
      {/* ── Header band — dark navy ─────────────────────────────────────── */}
      <div className="bg-[#0D1B4B] px-4 py-3 flex items-center justify-between relative overflow-hidden">
        {/* Subtle corner shine */}
        <div className="absolute top-0 right-0 w-12 h-12 rounded-bl-3xl bg-white/3 pointer-events-none" />

        {/* Team name */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
          {workflow.team}
        </span>

        {/* Status dot + label */}
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusCfg.dot)} />
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusCfg.badge)}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* ── Card body — white ───────────────────────────────────────────── */}
      <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl px-4 pt-4 pb-3">

        {/* Title */}
        <h3 className="font-bold text-[#0D1B4B] text-sm leading-snug mb-1 tracking-tight line-clamp-2 group-hover:text-[#00C48C] transition-colors duration-150">
          {workflow.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {workflow.description}
        </p>

        {/* Due date + overdue flag */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className={cn(
              "text-[10px] font-semibold",
              workflow.dueDate === "Overdue" ? "text-red-500" : "text-gray-400"
            )}
          >
            {workflow.team} ·{" "}
            <span
              className={
                workflow.dueDate === "Overdue" ? "text-red-500" : "text-gray-400"
              }
            >
              {workflow.dueDate}
            </span>
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {/* Priority badge */}
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              priorityCfg.classes
            )}
          >
            {priorityCfg.label} Priority
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400 font-medium">Progress</span>
            <span className="text-[10px] font-bold text-[#0D1B4B]">
              {workflow.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressColor(workflow.progress)
              )}
              style={{ width: `${workflow.progress}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {workflow.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {workflow.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0D1B4B]/6 text-[#0D1B4B]/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer — assignee + tasks left */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
          <div className="flex items-center gap-2">
            {/* Avatar — keep original gradient per person */}
            <div
              className={cn(
                "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white",
                workflow.assignee.color
              )}
            >
              {workflow.assignee.initials}
            </div>
            <span className="text-xs font-medium text-gray-500">
              {workflow.assignee.name}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">
            {workflow.tasksLeft === 0
              ? "✓ Done"
              : `${workflow.tasksLeft} task${workflow.tasksLeft !== 1 ? "s" : ""} left`}
          </span>
        </div>
      </div>
    </div>
  );
}
