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

    // FIXED: Use stage instead of status (based on your schema)
    const updatedWorkflow = await db.workflow.update({
      where: { id },
      data: { stage: status as any }, // Convert status to stage
    });

    const changedBy = await db.user.findUnique({
      where: { id: changedById },
      select: { name: true },
    });

    if (workflow.assigneeId && workflow.assigneeId !== changedById) {
      await createNotification({
        type: "STATUS_CHANGE",
        title: "Workflow status changed",
        message: `${changedBy?.name ?? "Someone"} changed status of "${workflow.title}" from ${oldStatus} to ${status}`,
        userId: workflow.assigneeId,
        workflowId: id,
      });

      if (workflow.assignee?.email) {
        await triggerStatusChangeEmail(id, oldStatus, status, changedById);
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
