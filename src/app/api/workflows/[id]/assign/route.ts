import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { triggerAssignmentEmail } from "@/lib/email-triggers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { assigneeId, assignedById } = await request.json();

    // Get workflow details
    const workflow = await db.workflow.findUnique({
      where: { id },
      select: { title: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Update workflow assignee
    const updatedWorkflow = await db.workflow.update({
      where: { id },
      data: { assigneeId },
    });

    // Get assignee details
    const assignee = await db.user.findUnique({
      where: { id: assigneeId },
      select: { name: true, email: true },
    });

    // Create in-app notification - FIXED: Changed "ASSIGNMENT" to "ASSIGNED"
    await createNotification({
      type: "ASSIGNED",
      title: "New workflow assigned",
      message: `You've been assigned to "${workflow.title}"`,
      userId: assigneeId,
      workflowId: id,
    });

    // Send email notification
    if (assignee?.email) {
      const emailResult = await triggerAssignmentEmail(
        id,
        assigneeId,
        assignedById,
      );

      if (emailResult.success) {
        console.log(`📧 Assignment email sent to ${assignee.name}`);
      }
    }

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign workflow" },
      { status: 500 },
    );
  }
}
