import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const workflowsDueTomorrow = await db.workflow.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        progress: { not: 100 },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Also check for overdue workflows
    const overdueWorkflows = await db.workflow.findMany({
      where: {
        dueDate: { lt: today },
        progress: { not: 100 },
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      workflowsDueTomorrow: workflowsDueTomorrow.map((w) => ({
        id: w.id,
        title: w.title,
        dueDate: w.dueDate,
        assignee: w.assignee?.name,
      })),
      overdueCount: overdueWorkflows.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
