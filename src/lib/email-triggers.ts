// lib/email-triggers.ts
import { prisma } from "@/lib/prisma";
import {
  sendMentionEmail,
  sendOverdueEmail,
  sendStatusChangeEmail,
  sendAssignmentEmail,
  sendTaskCompletedEmail,
} from "@/lib/email";

// Trigger email when someone is mentioned in a comment
export async function triggerMentionEmail(
  mentionedUserId: string,
  mentionedByName: string,
  workflowId: string,
  comment: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: mentionedUserId },
      select: { email: true, name: true },
    });

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { title: true },
    });

    if (!user?.email) {
      console.log(`No email for user ${mentionedUserId}`);
      return { success: false, error: "No email address" };
    }

    const result = await sendMentionEmail(
      user.email,
      mentionedByName,
      workflow?.title || "a workflow",
      comment,
      workflowId,
    );

    return result;
  } catch (error) {
    console.error("Failed to send mention email:", error);
    return { success: false, error };
  }
}

// Trigger email when workflow becomes overdue
export async function triggerOverdueEmail(workflowId: string) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        assignee: { select: { email: true, name: true } },
      },
    });

    if (!workflow?.assignee?.email) {
      console.log(`No assignee email for workflow ${workflowId}`);
      return { success: false, error: "No assignee email" };
    }

    const result = await sendOverdueEmail(
      workflow.assignee.email,
      workflow.assignee.name,
      workflow.title,
      workflow.dueDate,
      workflowId,
    );

    return result;
  } catch (error) {
    console.error("Failed to send overdue email:", error);
    return { success: false, error };
  }
}

// Trigger email when workflow status changes
export async function triggerStatusChangeEmail(
  workflowId: string,
  oldStatus: string,
  newStatus: string,
  changedByUserId: string,
) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        assignee: { select: { email: true, name: true } },
      },
    });

    const changedBy = await prisma.user.findUnique({
      where: { id: changedByUserId },
      select: { name: true },
    });

    if (!workflow?.assignee?.email) {
      console.log(`No assignee email for workflow ${workflowId}`);
      return { success: false, error: "No assignee email" };
    }

    const result = await sendStatusChangeEmail(
      workflow.assignee.email,
      workflow.title,
      oldStatus,
      newStatus,
      changedBy?.name || "Someone",
      workflowId,
    );

    return result;
  } catch (error) {
    console.error("Failed to send status change email:", error);
    return { success: false, error };
  }
}

// Trigger email when workflow is assigned
export async function triggerAssignmentEmail(
  workflowId: string,
  assigneeUserId: string,
  assignedByUserId: string,
) {
  try {
    const [workflow, assignee, assignedBy] = await Promise.all([
      prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { title: true },
      }),
      prisma.user.findUnique({
        where: { id: assigneeUserId },
        select: { email: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: assignedByUserId },
        select: { name: true },
      }),
    ]);

    if (!assignee?.email) {
      console.log(`No email for assignee ${assigneeUserId}`);
      return { success: false, error: "No assignee email" };
    }

    const result = await sendAssignmentEmail(
      assignee.email,
      assignee.name || "Team Member",
      workflow?.title || "a workflow",
      assignedBy?.name || "Someone",
      workflowId,
    );

    return result;
  } catch (error) {
    console.error("Failed to send assignment email:", error);
    return { success: false, error };
  }
}

// Trigger email when task is completed
export async function triggerTaskCompletedEmail(
  workflowId: string,
  taskTitle: string,
  completedByUserId: string,
) {
  try {
    const [workflow, completedBy] = await Promise.all([
      prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { assignee: { select: { email: true, name: true } } },
      }),
      prisma.user.findUnique({
        where: { id: completedByUserId },
        select: { name: true },
      }),
    ]);

    if (!workflow?.assignee?.email) {
      console.log(`No assignee email for workflow ${workflowId}`);
      return { success: false, error: "No assignee email" };
    }

    const result = await sendTaskCompletedEmail(
      workflow.assignee.email,
      taskTitle,
      workflow.title,
      completedBy?.name || "Someone",
      workflowId,
    );

    return result;
  } catch (error) {
    console.error("Failed to send task completed email:", error);
    return { success: false, error };
  }
}
