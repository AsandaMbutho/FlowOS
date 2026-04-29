import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("=== Running due date reminders ===");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log(
      `Looking for workflows due between: ${tomorrow} and ${dayAfterTomorrow}`,
    );

    // Find workflows due tomorrow
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

    console.log(`Found ${workflowsDueTomorrow.length} workflows due tomorrow`);

    const remindersSent = [];

    for (const workflow of workflowsDueTomorrow) {
      if (!workflow.assignee) {
        console.log(`Skipping ${workflow.title} - no assignee`);
        continue;
      }

      try {
        // Create notification
        await db.notification.create({
          data: {
            type: "OVERDUE",
            title: "Workflow Due Tomorrow",
            message: `"${workflow.title}" is due tomorrow (${new Date(workflow.dueDate!).toLocaleDateString()}). Please update progress.`,
            userId: workflow.assignee.id,
            workflowId: workflow.id,
          },
        });

        remindersSent.push({
          id: workflow.id,
          title: workflow.title,
          assignee: workflow.assignee.name,
        });

        console.log(
          `Reminder sent to ${workflow.assignee.name} for "${workflow.title}"`,
        );
      } catch (err) {
        console.error(
          `Failed to create notification for ${workflow.title}:`,
          err,
        );
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersSent.length,
      workflows: remindersSent,
    });
  } catch (error) {
    console.error("Due date reminders error:", error);
    return NextResponse.json(
      { error: "Failed to send reminders", details: String(error) },
      { status: 500 },
    );
  }
}
