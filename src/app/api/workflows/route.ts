import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Priority, Stage } from "@prisma/client";
import { sendWorkflowLoadedNotification } from "@/lib/email-notifications";

// GET /api/workflows — fetch all workflows with assignee and files
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get("team");
    const stage = searchParams.get("stage");
    const priority = searchParams.get("priority");
    const assignee = searchParams.get("assignee");

    const workflows = await db.workflow.findMany({
      where: {
        ...(team && { team }),
        ...(stage && { stage: stage as Stage }),
        ...(priority && { priority: priority as Priority }),
        ...(assignee && { assignee: { name: assignee } }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        tasks: { select: { id: true, completed: true } },
        activities: {
          where: {
            OR: [
              { action: "assigned" },
              { action: "created" },
            ],
          },
          select: { action: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        files: {
          // 👈 ADD THIS: include files
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            size: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const shaped = workflows.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description ?? "",
      team: w.team ?? "",
      stage: w.stage,
      status: stageToStatus(w.stage),
      priority: w.priority,
      progress: w.progress,
      tasksLeft: w.tasks.filter((t) => !t.completed).length,
      tags: safeParseJson(w.tags),
      assignee: w.assignee
        ? {
            name: w.assignee.name ?? "",
            initials: (w.assignee.name ?? "?").charAt(0),
            color: assigneeColor(w.assignee.name ?? ""),
          }
        : {
            name: "Unassigned",
            initials: "?",
            color: "from-gray-400 to-gray-500",
          },
      dueDate: formatDueDate(w.dueDate, w.progress, w.completedAt),
      dueDateIso: w.dueDate ? w.dueDate.toISOString() : null,
      completedAt: w.completedAt ? w.completedAt.toISOString() : null,
      createdAt: w.createdAt.toISOString(),
      assignedDateIso:
        w.assignee && w.activities[0]
          ? w.activities[0].createdAt.toISOString()
          : w.assignee
            ? w.createdAt.toISOString()
            : null,
      files: w.files.map((f) => ({
        // 👈 ADD THIS: shape the files data
        id: f.id,
        filename: f.filename,
        originalName: f.originalName,
        url: f.url,
        size: f.size,
        mimeType: f.mimeType,
        createdAt: f.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 },
    );
  }
}

// POST /api/workflows — create new workflow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      team,
      assigneeName,
      priority,
      status,
      dueDate,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const assignee = assigneeName
      ? await db.user.findFirst({ where: { name: assigneeName } })
      : null;

    const workflow = await db.workflow.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? "",
        team: team ?? "Engineering",
        priority: (priority as Priority) ?? Priority.MEDIUM,
        stage: statusToStage(status ?? "To Do"),
        progress: 0,
        tags: JSON.stringify([team?.toLowerCase() ?? "general"]),
        assigneeId: assignee?.id ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        tasks: true,
        files: {
          // 👈 ADD THIS: include files in response
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            size: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });

    if (assignee) {
      await db.activity.create({
        data: {
          action: "created",
          details: `New workflow: ${workflow.title}`,
          userId: assignee.id,
          workflowId: workflow.id,
        },
      });
    }

    await sendWorkflowLoadedNotification(workflow.id);

    return NextResponse.json(
      {
        id: workflow.id,
        title: workflow.title,
        description: workflow.description ?? "",
        team: workflow.team ?? "",
        stage: workflow.stage,
        status: stageToStatus(workflow.stage),
        priority: workflow.priority,
        progress: workflow.progress,
        tasksLeft: 0,
        tags: safeParseJson(workflow.tags),
        assignee: workflow.assignee
          ? {
              name: workflow.assignee.name ?? "",
              initials: (workflow.assignee.name ?? "?").charAt(0),
              color: assigneeColor(workflow.assignee.name ?? ""),
            }
          : {
              name: "Unassigned",
              initials: "?",
              color: "from-gray-400 to-gray-500",
            },
        dueDate: formatDueDate(
          workflow.dueDate,
          workflow.progress,
          workflow.completedAt,
        ),
        dueDateIso: workflow.dueDate ? workflow.dueDate.toISOString() : null,
        createdAt: workflow.createdAt.toISOString(),
        assignedDateIso: workflow.assignee
          ? workflow.createdAt.toISOString()
          : null,
        files: workflow.files.map((f) => ({
          id: f.id,
          filename: f.filename,
          originalName: f.originalName,
          url: f.url,
          size: f.size,
          mimeType: f.mimeType,
          createdAt: f.createdAt.toISOString(),
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}

function stageToStatus(stage: Stage): string {
  const map: Record<Stage, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    DONE: "Completed",
    BLOCKED: "Blocked",
  };
  return map[stage];
}

function statusToStage(status: string): Stage {
  const map: Record<string, Stage> = {
    "To Do": Stage.TODO,
    "In Progress": Stage.IN_PROGRESS,
    Review: Stage.REVIEW,
    Completed: Stage.DONE,
    Blocked: Stage.BLOCKED,
  };
  return map[status] ?? Stage.TODO;
}

function formatDueDate(
  date: Date | null,
  progress: number,
  completedAt: Date | null,
): string {
  // If workflow is at 100%, show completion date
  if (progress === 100 && completedAt) {
    const dateObj = new Date(completedAt);
    return `Completed on ${dateObj.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  if (!date) return "No due date";
  const now = new Date();
  const diff = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return date.toLocaleDateString("en-ZA", { weekday: "long" });
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function safeParseJson(val: string | null): string[] {
  try {
    return JSON.parse(val ?? "[]");
  } catch {
    return [];
  }
}

function assigneeColor(name: string): string {
  const colors: Record<string, string> = {
    Asanda: "from-purple-500 to-pink-500",
    Sizwe: "from-green-500 to-teal-500",
    Themba: "from-blue-500 to-cyan-500",
    Ridwaan: "from-orange-500 to-red-500",
    Lutendo: "from-indigo-500 to-blue-500",
    Matlhodi: "from-rose-500 to-pink-500",
    "Neo Matekane": "from-amber-500 to-cyan-500",
  };
  return colors[name] ?? "from-gray-400 to-gray-500";
}
