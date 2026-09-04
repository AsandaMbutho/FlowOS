import { prisma } from "@/lib/prisma";
import {
  sendMentionEmail,
  sendOverdueEmail,
  sendStatusChangeEmail,
  sendAssignmentEmail,
  sendTaskCompletedEmail,
  sendSupervisorCommentUpdateEmail,
  sendLeaveRequestSubmittedEmail,
  sendLeaveRequestSubmissionConfirmationEmail,
  sendLeaveRequestDecisionEmail,
} from "./email";

// Get user email by ID
export async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email || null;
}

// Get all users in a team (for notifications)
export async function getTeamMemberEmails(
  teamName?: string,
): Promise<Array<{ id: string; email: string; name: string }>> {
  const users = await prisma.user.findMany({
    where: teamName
      ? {
          workflows: {
            some: {
              team: teamName,
            },
          },
        }
      : {},
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // Transform the users to ensure name is never null
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name || "Team Member", // Provide a default value if name is null
  }));
}

// Process overdue workflows and send emails
export async function checkAndSendOverdueNotifications() {
  try {
    const overdueWorkflows = await prisma.workflow.findMany({
      where: {
        dueDate: {
          lt: new Date(),
        },
        stage: {
          notIn: ["DONE"],
        },
      },
      include: {
        assignee: true,
      },
    });

    const results = [];

    for (const workflow of overdueWorkflows) {
      if (workflow.assignee?.email) {
        // Check if we already sent an overdue notification today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            workflowId: workflow.id,
            type: "OVERDUE",
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existingNotification) {
          const emailResult = await sendOverdueEmail(
            workflow.assignee.email,
            workflow.assignee.name || "Team member",
            workflow.title,
            workflow.dueDate!,
            workflow.id,
          );

          // Create notification record
          await prisma.notification.create({
            data: {
              type: "OVERDUE",
              title: `Workflow overdue: ${workflow.title}`,
              message: `This workflow was due on ${workflow.dueDate?.toLocaleDateString()}`,
              userId: workflow.assignee.id,
              workflowId: workflow.id,
            },
          });

          results.push({
            workflowId: workflow.id,
            emailSent: emailResult.success,
            error: emailResult.error,
          });
        }
      }
    }

    return { processed: results.length, results };
  } catch (error) {
    console.error("Error checking overdue workflows:", error);
    return { error };
  }
}

// Send email for mention notifications
export async function sendMentionNotifications(commentId: string) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
        workflow: true,
        mentions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!comment) return { error: "Comment not found" };

    const results = [];

    for (const mention of comment.mentions) {
      if (mention.user.email) {
        const emailResult = await sendMentionEmail(
          mention.user.email,
          comment.author?.name || "Someone",
          comment.workflow.title,
          comment.body,
          comment.workflow.id,
        );

        // Create notification record
        await prisma.notification.create({
          data: {
            type: "MENTION",
            title: `You were mentioned in ${comment.workflow.title}`,
            message: comment.body,
            userId: mention.user.id,
            workflowId: comment.workflow.id,
          },
        });

        results.push({
          userId: mention.user.id,
          emailSent: emailResult.success,
          error: emailResult.error,
        });
      }
    }

    return { processed: results.length, results };
  } catch (error) {
    console.error("Error sending mention notifications:", error);
    return { error };
  }
}

// Send every workflow comment to supervisors so they get continuous updates.
export async function sendSupervisorCommentNotifications(commentId: string) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
        workflow: true,
      },
    });

    if (!comment) return { error: "Comment not found" };

    const supervisors = await prisma.user.findMany({
      where: {
        role: { in: ["MANAGER", "ADMIN"] },
        email: { not: "" },
        id: { not: comment.authorId ?? undefined },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const results = [];

    for (const supervisor of supervisors) {
      if (!supervisor.email) continue;

      const emailResult = await sendSupervisorCommentUpdateEmail(
        supervisor.email,
        supervisor.name || "Supervisor",
        comment.author?.name || "Someone",
        comment.workflow.title,
        comment.body,
        comment.workflow.id,
      );

      results.push({
        userId: supervisor.id,
        email: supervisor.email,
        emailSent: emailResult.success,
        error: emailResult.error,
      });
    }

    return { success: true, processed: results.length, results };
  } catch (error) {
    console.error("Error sending supervisor comment notifications:", error);
    return { error };
  }
}

export async function sendLeaveRequestSubmittedNotifications(
  leaveRequestId: string,
) {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { user: true },
    });

    if (!leaveRequest) return { error: "Leave request not found" };

    let requesterEmailResult:
      | Awaited<ReturnType<typeof sendLeaveRequestSubmissionConfirmationEmail>>
      | undefined;

    if (leaveRequest.user.email) {
      requesterEmailResult = await sendLeaveRequestSubmissionConfirmationEmail(
        leaveRequest.user.email,
        leaveRequest.user.name || "Team member",
        leaveRequest.type,
        leaveRequest.startDate,
        leaveRequest.endDate,
        leaveRequest.reason ?? "",
      );

      await prisma.notification.create({
        data: {
          type: "ASSIGNED",
          title: "Leave request submitted",
          message:
            "Your leave request was submitted successfully and is pending supervisor review.",
          userId: leaveRequest.user.id,
          emailSent: requesterEmailResult.success,
          emailError: requesterEmailResult.success
            ? null
            : String(requesterEmailResult.error),
          emailSentAt: requesterEmailResult.success ? new Date() : null,
        },
      });
    }

    const supervisors = await prisma.user.findMany({
      where: {
        role: { in: ["MANAGER", "ADMIN"] },
        email: { not: "" },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const results = [];

    for (const supervisor of supervisors) {
      if (!supervisor.email) continue;

      const emailResult = await sendLeaveRequestSubmittedEmail(
        supervisor.email,
        supervisor.name || "Supervisor",
        leaveRequest.user.name || "Team member",
        leaveRequest.type,
        leaveRequest.startDate,
        leaveRequest.endDate,
        leaveRequest.reason ?? "",
      );

      results.push({
        userId: supervisor.id,
        email: supervisor.email,
        emailSent: emailResult.success,
        error: emailResult.error,
      });
    }

    return {
      success: true,
      requesterEmailSent: requesterEmailResult?.success ?? false,
      processed: results.length,
      results,
    };
  } catch (error) {
    console.error("Error sending leave request notifications:", error);
    return { error };
  }
}

export async function sendLeaveRequestDecisionNotification(
  leaveRequestId: string,
) {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: true,
        reviewer: true,
      },
    });

    if (!leaveRequest) return { error: "Leave request not found" };
    if (!leaveRequest.user.email) {
      return { error: "Requester has no email address" };
    }

    const emailResult = await sendLeaveRequestDecisionEmail(
      leaveRequest.user.email,
      leaveRequest.user.name || "Team member",
      leaveRequest.type,
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.status,
      leaveRequest.reviewer?.name || "Your supervisor",
      leaveRequest.managerNote,
    );

    await prisma.notification.create({
      data: {
        type: "STATUS_CHANGE",
        title: `Leave request ${leaveRequest.status.toLowerCase()}`,
        message: `Your ${leaveRequest.type.toLowerCase()} leave request from ${leaveRequest.startDate.toLocaleDateString()} to ${leaveRequest.endDate.toLocaleDateString()} was ${leaveRequest.status.toLowerCase()} by ${leaveRequest.reviewer?.name || "your supervisor"}.`,
        userId: leaveRequest.user.id,
        emailSent: emailResult.success,
        emailError: emailResult.success ? null : String(emailResult.error),
        emailSentAt: emailResult.success ? new Date() : null,
      },
    });

    return {
      success: true,
      userId: leaveRequest.user.id,
      email: leaveRequest.user.email,
      emailSent: emailResult.success,
      error: emailResult.error,
    };
  } catch (error) {
    console.error("Error sending leave decision notification:", error);
    return { error };
  }
}

// Send notification for workflow assignment
export async function sendAssignmentNotification(
  workflowId: string,
  assignedById: string,
) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        assignee: true,
      },
    });

    const assigner = await prisma.user.findUnique({
      where: { id: assignedById },
    });

    if (!workflow || !workflow.assignee?.email) {
      return { error: "Workflow or assignee not found" };
    }

    const emailResult = await sendAssignmentEmail(
      workflow.assignee.email,
      workflow.assignee.name || "Team member",
      workflow.title,
      assigner?.name || "Someone",
      workflow.id,
    );

    // Create notification record
    await prisma.notification.create({
      data: {
        type: "ASSIGNED",
        title: `Assigned to: ${workflow.title}`,
        message: `You have been assigned to this workflow by ${assigner?.name || "Someone"}`,
        userId: workflow.assignee.id,
        workflowId: workflow.id,
      },
    });

    return { success: true, emailSent: emailResult.success };
  } catch (error) {
    console.error("Error sending assignment notification:", error);
    return { error };
  }
}

// Send notification when a workflow is created.
// A null assigneeId means the workflow was assigned to "Everyone" in the UI.
export async function sendWorkflowLoadedNotification(workflowId: string) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        assignee: true,
      },
    });

    if (!workflow) return { error: "Workflow not found" };

    const recipients = workflow.assignee
      ? [workflow.assignee]
      : await prisma.user.findMany();

    const results = [];

    for (const user of recipients) {
      if (!user.email) continue;

      const emailResult = await sendAssignmentEmail(
        user.email,
        user.name || "Team member",
        workflow.title,
        "FlowOS",
        workflow.id,
      );

      await prisma.notification.create({
        data: {
          type: "ASSIGNED",
          title: `New workflow: ${workflow.title}`,
          message: workflow.assigneeId
            ? `You have been assigned to this workflow`
            : `A new workflow has been assigned to everyone`,
          userId: user.id,
          workflowId: workflow.id,
          emailSent: emailResult.success,
          emailError: emailResult.success ? null : String(emailResult.error),
          emailSentAt: emailResult.success ? new Date() : null,
        },
      });

      results.push({
        userId: user.id,
        email: user.email,
        emailSent: emailResult.success,
        error: emailResult.error,
      });
    }

    return { success: true, processed: results.length, results };
  } catch (error) {
    console.error("Error sending workflow loaded notification:", error);
    return { error };
  }
}

// Send notification for status change
export async function sendStatusChangeNotification(
  workflowId: string,
  oldStatus: string,
  newStatus: string,
  changedById: string,
) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        assignee: true,
      },
    });

    const changer = await prisma.user.findUnique({
      where: { id: changedById },
    });

    if (!workflow) return { error: "Workflow not found" };

    // Notify the assignee if they're not the one who made the change
    if (workflow.assignee?.email && workflow.assignee.id !== changedById) {
      const emailResult = await sendStatusChangeEmail(
        workflow.assignee.email,
        workflow.title,
        oldStatus,
        newStatus,
        changer?.name || "Someone",
        workflow.id,
      );

      // Create notification record
      await prisma.notification.create({
        data: {
          type: "STATUS_CHANGE",
          title: `Status changed: ${workflow.title}`,
          message: `Status changed from ${oldStatus} to ${newStatus} by ${changer?.name || "Someone"}`,
          userId: workflow.assignee.id,
          workflowId: workflow.id,
        },
      });

      return { success: true, emailSent: emailResult.success };
    }

    return { success: true, notified: false };
  } catch (error) {
    console.error("Error sending status change notification:", error);
    return { error };
  }
}

// Send notification for task completion
export async function sendTaskCompletionNotification(
  taskId: string,
  completedById: string,
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workflow: {
          include: {
            assignee: true,
          },
        },
        assignee: true,
      },
    });

    const completer = await prisma.user.findUnique({
      where: { id: completedById },
    });

    if (!task || !task.workflow) return { error: "Task or workflow not found" };

    // Notify the workflow assignee if they're not the one who completed the task
    if (
      task.workflow.assignee?.email &&
      task.workflow.assignee.id !== completedById
    ) {
      const emailResult = await sendTaskCompletedEmail(
        task.workflow.assignee.email,
        task.title,
        task.workflow.title,
        completer?.name || "Someone",
        task.workflow.id,
      );

      // Create notification record
      await prisma.notification.create({
        data: {
          type: "TASK_COMPLETED",
          title: `Task completed: ${task.title}`,
          message: `${completer?.name || "Someone"} completed a task in ${task.workflow.title}`,
          userId: task.workflow.assignee.id,
          workflowId: task.workflow.id,
        },
      });

      return { success: true, emailSent: emailResult.success };
    }

    return { success: true, notified: false };
  } catch (error) {
    console.error("Error sending task completion notification:", error);
    return { error };
  }
}
