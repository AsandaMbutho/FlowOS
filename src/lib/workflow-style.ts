import type { Priority, Stage } from "@/types/workflow";

// Monday.com-style three-color status system: green when done, orange
// while it's being worked on, red for anything not yet complete.
export type StatusColor = "green" | "orange" | "red";

export const STATUS_META: Record<Stage, { label: string; color: StatusColor }> = {
  DONE: { label: "Done", color: "green" },
  IN_PROGRESS: { label: "Working on it", color: "orange" },
  REVIEW: { label: "Working on it", color: "orange" },
  TODO: { label: "Incomplete", color: "red" },
  BLOCKED: { label: "Incomplete", color: "red" },
};

export const STATUS_COLOR_CLASSES: Record<
  StatusColor,
  { solid: string; soft: string; text: string; ring: string }
> = {
  green: {
    solid: "bg-emerald-500",
    soft: "bg-emerald-100",
    text: "text-emerald-700",
    ring: "ring-emerald-500/30",
  },
  orange: {
    solid: "bg-orange-500",
    soft: "bg-orange-100",
    text: "text-orange-700",
    ring: "ring-orange-500/30",
  },
  red: {
    solid: "bg-red-500",
    soft: "bg-red-100",
    text: "text-red-700",
    ring: "ring-red-500/30",
  },
};

export function statusMeta(stage: Stage) {
  const meta = STATUS_META[stage];
  return { ...meta, classes: STATUS_COLOR_CLASSES[meta.color] };
}

// Priority scale requested: dark purple (high) -> light bluish-purple
// (medium) -> light teal (low).
export const PRIORITY_META: Record<
  Priority,
  { label: string; bg: string; text: string }
> = {
  HIGH: { label: "High", bg: "bg-[#4c1d95]", text: "text-white" },
  MEDIUM: { label: "Medium", bg: "bg-[#c7d2fe]", text: "text-[#4338ca]" },
  LOW: { label: "Low", bg: "bg-teal-100", text: "text-teal-700" },
};
