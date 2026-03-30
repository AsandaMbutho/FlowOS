import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only supervisors (MANAGER/ADMIN) can access
    if (
      !session ||
      (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all workflows with assignees
    const workflows = await prisma.workflow.findMany({
      include: {
        assignee: true,
      },
    });

    // Calculate stats
    const totalWorkflows = workflows.length;
    const completedWorkflows = workflows.filter(
      (w) => w.stage === "DONE",
    ).length;
    const inProgressWorkflows = workflows.filter(
      (w) => w.stage === "IN_PROGRESS",
    ).length;
    const overdueWorkflows = workflows.filter(
      (w) => w.dueDate && w.dueDate < new Date() && w.stage !== "DONE",
    ).length;

    // Team progress by member
    const teamProgress = await prisma.user.findMany({
      where: {
        workflows: {
          some: {},
        },
      },
      include: {
        workflows: true,
      },
    });

    const teamProgressData = teamProgress.map((user) => ({
      name: user.name || user.email.split("@")[0],
      progress:
        user.workflows.length > 0
          ? Math.round(
              user.workflows.reduce((sum, w) => sum + w.progress, 0) /
                user.workflows.length,
            )
          : 0,
    }));

    // Status distribution
    const statusDistribution = [
      {
        name: "To Do",
        value: workflows.filter((w) => w.stage === "TODO").length,
      },
      {
        name: "In Progress",
        value: workflows.filter((w) => w.stage === "IN_PROGRESS").length,
      },
      {
        name: "Review",
        value: workflows.filter((w) => w.stage === "REVIEW").length,
      },
      {
        name: "Blocked",
        value: workflows.filter((w) => w.stage === "BLOCKED").length,
      },
      {
        name: "Done",
        value: workflows.filter((w) => w.stage === "DONE").length,
      },
    ].filter((item) => item.value > 0);

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        workflow: true,
      },
    });

    const formattedActivities = recentActivities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      userName: activity.user?.name || "Unknown",
      workflowTitle: activity.workflow?.title || "Unknown",
      createdAt: activity.createdAt,
    }));

    return NextResponse.json({
      totalWorkflows,
      completedWorkflows,
      inProgressWorkflows,
      overdueWorkflows,
      teamProgress: teamProgressData,
      statusDistribution,
      recentActivities: formattedActivities,
    });
  } catch (error) {
    console.error("Error fetching supervisor stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
