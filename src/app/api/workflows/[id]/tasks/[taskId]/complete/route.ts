import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { triggerTaskCompletedEmail } from "@/lib/email-triggers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const { id, taskId } = await params;
    const { completedById, taskTitle } = await request.json();

    // Update task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { completed: true },
    });

    // Get workflow with assignee
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    // Get completer's name
    const completedBy = await db.user.findUnique({
      where: { id: completedById },
      select: { name: true },
    });

    // Create in-app notification for assignee
    if (workflow?.assigneeId && workflow.assigneeId !== completedById) {
      await createNotification({
        type: "TASK_COMPLETED",
        title: "Task completed",
        message: `${completedBy?.name ?? "Someone"} completed "${taskTitle}" in "${workflow.title}"`,
        userId: workflow.assigneeId,
        workflowId: id,
      });

      // Send email notification
      if (workflow.assignee?.email) {
        const emailResult = await triggerTaskCompletedEmail(
          id,
          taskTitle,
          completedById,
        );

        if (emailResult.success) {
          console.log(
            `📧 Task completion email sent to ${workflow.assignee.name}`,
          );
        }
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 },
    );
  }
}
