import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Priority, Stage } from "@prisma/client";
import { createNotification } from "@/lib/notifications";

const STAGE_LABELS: Record<Stage, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Completed",
  BLOCKED: "Blocked",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        tasks: true,
        files: true,
        activities: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("GET /api/workflows/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      stage,
      priority,
      progress,
      team,
      dueDate,
      assigneeName,
    } = body;

    const previous = await db.workflow.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, name: true } } },
    });

    const assignee = assigneeName
      ? await db.user.findFirst({ where: { name: assigneeName } })
      : undefined;

    let fixedDueDate = undefined;
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        fixedDueDate = null;
      } else {
        const dateObj = new Date(dueDate);
        if (!isNaN(dateObj.getTime())) {
          fixedDueDate = new Date(
            Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              12,
              0,
              0,
            ),
          );
        }
      }
    }

    let completedAt = undefined;
    if (progress !== undefined) {
      const isNowCompleted = progress === 100;
      const wasPreviouslyCompleted = previous?.stage === "DONE";

      if (isNowCompleted && !wasPreviouslyCompleted) {
        completedAt = new Date();
      } else if (!isNowCompleted) {
        completedAt = null;
      }
    }

    const updated = await db.workflow.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(stage !== undefined && { stage: stage as Stage }),
        ...(priority !== undefined && { priority: priority as Priority }),
        ...(progress !== undefined && { progress }),
        ...(team !== undefined && { team }),
        ...(fixedDueDate !== undefined && { dueDate: fixedDueDate }),
        ...(assignee !== undefined && { assigneeId: assignee?.id ?? null }),
        ...(completedAt !== undefined && { completedAt }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        tasks: { select: { id: true, completed: true } },
        files: true,
      },
    });

    if (stage && previous && stage !== previous.stage) {
      await createNotification({
        type: "STATUS_CHANGE",
        title: "Workflow Status Updated",
        message: `"${updated.title}" moved from ${STAGE_LABELS[previous.stage]} → ${STAGE_LABELS[stage as Stage]}`,
        userId: updated.assigneeId,
        workflowId: id,
      });
    }

    if (assignee && previous && assignee.id !== previous.assigneeId) {
      await createNotification({
        type: "ASSIGNED",
        title: "Workflow Assigned",
        message: `"${updated.title}" has been assigned to ${assignee.name}`,
        userId: assignee.id,
        workflowId: id,
      });
    }

    await db.activity.create({
      data: {
        action: "updated",
        details: `Updated workflow: ${updated.title}`,
        workflowId: id,
        userId: updated.assigneeId ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/workflows/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await db.notification.deleteMany({ where: { workflowId: id } });
    await db.activity.deleteMany({ where: { workflowId: id } });
    await db.comment.deleteMany({ where: { workflowId: id } });
    await db.task.deleteMany({ where: { workflowId: id } });
    await db.workflowStageHistory.deleteMany({ where: { workflowId: id } });
    await db.file.deleteMany({ where: { workflowId: id } });
    await db.workflow.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 },
    );
  }
}
