export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Stage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
export type Status = "To Do" | "In Progress" | "Review" | "Completed" | "Blocked";

export interface Assignee {
  name: string;
  initials: string;
  color: string;
}

export interface Workflow {
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
  dueDateIso: string | null;
  createdAt: string;
  completedAt: string | null;
}
