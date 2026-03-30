import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/tasks — create a new task
export async function POST(request: Request) {
  try {
    const { title, workflowId } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!workflowId) {
      return NextResponse.json(
        { error: "workflowId is required" },
        { status: 400 },
      );
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        workflowId,
        completed: false,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
