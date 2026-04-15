import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { triggerStatusChangeEmail } from "@/lib/email-triggers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, changedById, oldStatus } = await request.json();

    // Get workflow with assignee
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Update status
    const updatedWorkflow = await db.workflow.update({
      where: { id },
      data: { status },
    });

    // Get changer's name
    const changedBy = await db.user.findUnique({
      where: { id: changedById },
      select: { name: true },
    });

    // Create in-app notification for assignee
    if (workflow.assigneeId && workflow.assigneeId !== changedById) {
      await createNotification({
        type: "STATUS_UPDATE",
        title: "Workflow status changed",
        message: `${changedBy?.name ?? "Someone"} changed status of "${workflow.title}" from ${oldStatus} to ${status}`,
        userId: workflow.assigneeId,
        workflowId: id,
      });

      // Send email notification
      if (workflow.assignee?.email) {
        const emailResult = await triggerStatusChangeEmail(
          id,
          oldStatus,
          status,
          changedById,
        );

        if (emailResult.success) {
          console.log(
            `📧 Status change email sent to ${workflow.assignee.name}`,
          );
        }
      }
    }

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
