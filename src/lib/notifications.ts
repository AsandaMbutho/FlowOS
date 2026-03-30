import { db } from "@/lib/db";
import { NotifType } from "@prisma/client";

export async function createNotification({
  type,
  title,
  message,
  userId,
  workflowId,
}: {
  type: NotifType;
  title: string;
  message: string;
  userId?: string | null;
  workflowId?: string | null;
}) {
  try {
    await db.notification.create({
      data: {
        type,
        title,
        message,
        userId: userId ?? null,
        workflowId: workflowId ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function checkOverdueWorkflows() {
  try {
    const overdue = await db.workflow.findMany({
      where: {
        dueDate: { lt: new Date() },
        stage: { notIn: ["DONE"] },
      },
      include: { assignee: { select: { id: true, name: true } } },
    });

    for (const w of overdue) {
      const existing = await db.notification.findFirst({
        where: {
          workflowId: w.id,
          type: "OVERDUE",
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!existing) {
        await createNotification({
          type: "OVERDUE",
          title: "Workflow Overdue",
          message: `"${w.title}" is past its due date`,
          userId: w.assignee?.id ?? null,
          workflowId: w.id,
        });
      }
    }
  } catch (error) {
    console.error("checkOverdueWorkflows error:", error);
  }
}
