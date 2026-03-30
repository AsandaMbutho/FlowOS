import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Define types
type WorkflowWithRelations = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  stage: string;
  assigneeId: string | null;
  team: string | null;
  tags: string;
  dueDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  assignee: { name: string | null } | null;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    workflowId: string;
    assigneeId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

type TaskWithWorkflow = {
  id: string;
  title: string;
  completed: boolean;
  workflowId: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  workflow: {
    assignee: { name: string | null } | null;
  } | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // ── 1. All workflows ────────────────────────────────────────────────────
    const workflows = (await db.workflow.findMany({
      include: {
        tasks: true,
        assignee: { select: { name: true } },
      },
    })) as WorkflowWithRelations[];

    // ── 2. Workflows by status ──────────────────────────────────────────────
    const byStatus = [
      { label: "To Do", stage: "TODO", color: "#94a3b8" },
      { label: "In Progress", stage: "IN_PROGRESS", color: "#3b82f6" },
      { label: "Review", stage: "REVIEW", color: "#f59e0b" },
      { label: "Completed", stage: "DONE", color: "#22c55e" },
      { label: "Blocked", stage: "BLOCKED", color: "#ef4444" },
    ].map((s: { label: string; stage: string; color: string }) => ({
      ...s,
      value: workflows.filter((w: WorkflowWithRelations) => w.stage === s.stage)
        .length,
    }));

    // ── 3. Priority breakdown ───────────────────────────────────────────────
    const byPriority = [
      { label: "High", priority: "HIGH", color: "#ef4444" },
      { label: "Medium", priority: "MEDIUM", color: "#f59e0b" },
      { label: "Low", priority: "LOW", color: "#22c55e" },
    ].map((p: { label: string; priority: string; color: string }) => ({
      ...p,
      value: workflows.filter(
        (w: WorkflowWithRelations) => w.priority === p.priority,
      ).length,
    }));

    // ── 4. Overdue vs on-track ──────────────────────────────────────────────
    const now = new Date();
    const overdueCount = workflows.filter(
      (w: WorkflowWithRelations) =>
        w.dueDate && new Date(w.dueDate) < now && w.stage !== "DONE",
    ).length;
    const onTrackCount = workflows.filter(
      (w: WorkflowWithRelations) =>
        w.dueDate && new Date(w.dueDate) >= now && w.stage !== "DONE",
    ).length;
    const completedCount = workflows.filter(
      (w: WorkflowWithRelations) => w.stage === "DONE",
    ).length;
    const noDueDateCount = workflows.filter(
      (w: WorkflowWithRelations) => !w.dueDate && w.stage !== "DONE",
    ).length;

    const overdueVsOnTrack = [
      { label: "On Track", value: onTrackCount, color: "#22c55e" },
      { label: "Overdue", value: overdueCount, color: "#ef4444" },
      { label: "Completed", value: completedCount, color: "#3b82f6" },
      { label: "No Due Date", value: noDueDateCount, color: "#94a3b8" },
    ];

    // ── 5. Average progress by team ─────────────────────────────────────────
    const teamMap: Record<string, number[]> = {};
    for (const w of workflows) {
      const team = w.team ?? "Unknown";
      if (!teamMap[team]) teamMap[team] = [];
      teamMap[team].push(w.progress);
    }
    const avgProgressByTeam = Object.entries(teamMap)
      .map(([team, progresses]: [string, number[]]) => ({
        team,
        avg: Math.round(
          progresses.reduce((a: number, b: number) => a + b, 0) /
            progresses.length,
        ),
      }))
      .sort((a: { avg: number }, b: { avg: number }) => b.avg - a.avg);

    // ── 6. Tasks completed per team member ──────────────────────────────────
    const tasks = (await db.task.findMany({
      where: { completed: true },
      include: {
        workflow: {
          include: { assignee: { select: { name: true } } },
        },
      },
    })) as TaskWithWorkflow[];

    const memberTaskMap: Record<string, number> = {};
    for (const task of tasks) {
      const name = task.workflow?.assignee?.name ?? "Unassigned";
      memberTaskMap[name] = (memberTaskMap[name] ?? 0) + 1;
    }
    const tasksByMember = Object.entries(memberTaskMap)
      .map(([name, count]: [string, number]) => ({ name, count }))
      .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

    // ── 7. Workflow completion rate over time ────────────────────────────────
    // Build daily buckets for the last `days` days
    const buckets: Record<string, { completed: number; created: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { completed: 0, created: 0 };
    }

    const recentWorkflows = await db.workflow.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, stage: true, updatedAt: true },
    });

    for (const w of recentWorkflows) {
      const createdKey = w.createdAt.toISOString().slice(0, 10);
      if (buckets[createdKey]) buckets[createdKey].created++;
      if (w.stage === "DONE") {
        const doneKey = w.updatedAt.toISOString().slice(0, 10);
        if (buckets[doneKey]) buckets[doneKey].completed++;
      }
    }

    const completionOverTime = Object.entries(buckets).map(
      ([date, vals]: [string, { completed: number; created: number }]) => ({
        date: new Date(date).toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "short",
        }),
        ...vals,
      }),
    );

    // ── Summary stats ────────────────────────────────────────────────────────
    const totalWorkflows = workflows.length;
    const totalTasks = await db.task.count();
    const completedTasks = await db.task.count({ where: { completed: true } });
    const avgProgress = Math.round(
      workflows.reduce(
        (a: number, w: WorkflowWithRelations) => a + w.progress,
        0,
      ) / (totalWorkflows || 1),
    );

    return NextResponse.json({
      summary: {
        totalWorkflows,
        totalTasks,
        completedTasks,
        avgProgress,
        overdueCount,
      },
      byStatus,
      byPriority,
      overdueVsOnTrack,
      avgProgressByTeam,
      tasksByMember,
      completionOverTime,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
