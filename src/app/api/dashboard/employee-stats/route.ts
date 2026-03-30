import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Define types
type Workflow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  stage: string;
  assigneeId: string | null;
  team: string | null;
  tags: string;
  dueDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type Activity = {
  id: string;
  action: string;
  details: string | null;
  userId: string | null;
  workflowId: string;
  metadata: string | null;
  createdAt: Date;
  user: { name: string | null } | null;
  workflow: { title: string } | null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's assigned workflows
    const myWorkflows = (await prisma.workflow.findMany({
      where: {
        assigneeId: userId,
      },
      orderBy: { dueDate: "asc" },
    })) as Workflow[];

    // Get all workflows (for team visibility)
    const allWorkflows = (await prisma.workflow.findMany({
      where: {
        assigneeId: {
          not: userId, // Exclude their own
        },
      },
      include: {
        assignee: true,
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    })) as Workflow[];

    // Calculate my stats
    const myStats = {
      total: myWorkflows.length,
      completed: myWorkflows.filter((w: Workflow) => w.stage === "DONE").length,
      inProgress: myWorkflows.filter((w: Workflow) => w.stage === "IN_PROGRESS")
        .length,
    };

    // Format my workflows
    const formattedMyWorkflows = myWorkflows.map((w: Workflow) => ({
      id: w.id,
      title: w.title,
      progress: w.progress,
      stage: w.stage,
      dueDate: w.dueDate,
      priority: w.priority,
    }));

    // Format team workflows
    const formattedTeamWorkflows = allWorkflows.map((w: Workflow) => ({
      id: w.id,
      title: w.title,
      assigneeName: w.assignee?.name || "Unknown",
      progress: w.progress,
      stage: w.stage,
    }));

    // Get recent updates (activities from workflows they're involved in)
    const recentUpdates = (await prisma.activity.findMany({
      where: {
        OR: [{ userId }, { workflow: { assigneeId: userId } }],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        workflow: true,
      },
    })) as Activity[];

    const formattedUpdates = recentUpdates.map((activity: Activity) => ({
      id: activity.id,
      userName: activity.user?.name || "Unknown",
      action: activity.action,
      workflowTitle: activity.workflow?.title || "Unknown",
      createdAt: activity.createdAt,
    }));

    return NextResponse.json({
      myWorkflows: formattedMyWorkflows,
      teamWorkflows: formattedTeamWorkflows,
      myStats,
      recentUpdates: formattedUpdates,
    });
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
