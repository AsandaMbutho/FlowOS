import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Stage } from "@prisma/client";
import { Prisma } from "@prisma/client";

type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
  include: {
    assignee: { select: { name: true } };
    tasks: { select: { completed: true } };
  };
}>;

export async function GET() {
  try {
    const workflows = await db.workflow.findMany({
      include: {
        assignee: { select: { name: true } },
        tasks: { select: { completed: true } },
      },
    });

    const total = workflows.length;
    const blocked = workflows.filter((w) => w.stage === Stage.BLOCKED).length;
    const overdue = workflows.filter(
      (w) => w.dueDate && w.dueDate < new Date() && w.stage !== Stage.DONE,
    ).length;
    const atRisk = blocked + overdue;
    const active = workflows.filter((w) => w.stage !== Stage.DONE);
    const efficiency =
      active.length > 0
        ? Math.round(
            active.reduce((sum, w) => sum + w.progress, 0) / active.length,
          )
        : 100;

    const reviewCount = workflows.filter(
      (w) => w.stage === Stage.REVIEW,
    ).length;
    const bottlenecks =
      (reviewCount >= 2 ? 1 : 0) +
      (blocked >= 1 ? 1 : 0) +
      (overdue >= 1 ? 1 : 0);

    const assigneeProgress: Record<string, number[]> = {};
    workflows.forEach((w) => {
      const name = w.assignee?.name ?? "Unknown";
      if (!assigneeProgress[name]) assigneeProgress[name] = [];
      assigneeProgress[name].push(w.progress);
    });
    const topPerformer = Object.entries(assigneeProgress)
      .map(([name, scores]) => ({
        name,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.avg - a.avg)[0];

    const activeCounts: Record<string, number> = {};
    active.forEach((w) => {
      const name = w.assignee?.name ?? "Unknown";
      activeCounts[name] = (activeCounts[name] || 0) + 1;
    });
    const overloaded = Object.entries(activeCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const recommendations: string[] = [];
    if (blocked > 0) {
      const blockedTitles = workflows
        .filter((w) => w.stage === Stage.BLOCKED)
        .map((w) => w.title)
        .join(", ");
      recommendations.push(
        `🔴 ${blocked} workflow${blocked > 1 ? "s" : ""} blocked: ${blockedTitles.slice(0, 80)}`,
      );
    }
    if (overdue > 0) {
      recommendations.push(
        `⚠️ ${overdue} workflow${overdue > 1 ? "s" : ""} overdue — review priorities immediately`,
      );
    }
    if (topPerformer && overloaded && overloaded[0] !== topPerformer.name) {
      recommendations.push(
        `📊 Reassign tasks from ${overloaded[0]} (${overloaded[1]} active) to ${topPerformer.name} (${topPerformer.avg}% avg)`,
      );
    }
    if (reviewCount >= 2) {
      recommendations.push(
        `📋 ${reviewCount} items in Review queue — schedule a review session`,
      );
    }

    const nearDone = workflows.filter(
      (w) => w.progress >= 80 && w.stage !== Stage.DONE,
    ).length;

    return NextResponse.json({
      summary: { atRisk, efficiency, bottlenecks },
      detailed: `${active.length} active workflows with ${efficiency}% avg progress. ${
        topPerformer
          ? `${topPerformer.name} leads at ${topPerformer.avg}% completion rate.`
          : ""
      } ${blocked > 0 ? `${blocked} workflow${blocked > 1 ? "s" : ""} blocked.` : "No blocked workflows."}`,
      recommendations,
      predictions: [
        `${nearDone} workflow${nearDone !== 1 ? "s" : ""} likely to complete this week`,
        reviewCount >= 2
          ? `Review bottleneck clears in ~${reviewCount} days if addressed today`
          : "No major bottlenecks predicted in next 24h",
      ],
    });
  } catch (error) {
    console.error("GET /api/ai/insights error:", error);
    return NextResponse.json(
      { error: "Failed to compute insights" },
      { status: 500 },
    );
  }
}
