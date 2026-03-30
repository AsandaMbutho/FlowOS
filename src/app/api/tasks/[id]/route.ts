import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// PATCH /api/tasks/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { completed, assigneeName } = await request.json();

    // Resolve assignee if provided
    const assignee = assigneeName
      ? await db.user.findFirst({ where: { name: assigneeName } })
      : undefined;

    const task = await db.task.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(assignee !== undefined && { assigneeId: assignee?.id ?? null }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        workflow: {
          include: { assignee: { select: { id: true } } },
        },
      },
    });

    // Notify on task completion
    if (completed && task.workflow) {
      await createNotification({
        type: "TASK_COMPLETED",
        title: "Task Completed",
        message: `"${task.title}" was completed in ${task.workflow.title}`,
        userId: task.workflow.assignee?.id ?? null,
        workflowId: task.workflowId,
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
