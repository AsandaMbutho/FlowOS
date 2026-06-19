import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/comments?workflowId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { error: "workflowId is required" },
        { status: 400 },
      );
    }

    const comments = await db.comment.findMany({
      where: { workflowId },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

// POST /api/comments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflowId, body: commentBody, authorId } = body;

    if (!workflowId || !commentBody?.trim()) {
      return NextResponse.json(
        { error: "workflowId and body are required" },
        { status: 400 },
      );
    }

    const comment = await db.comment.create({
      data: {
        workflowId,
        body: commentBody.trim(),
        authorId: authorId || null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
