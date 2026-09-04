import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { sendSupervisorCommentNotifications } from "@/lib/email-notifications";

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
    const { workflowId, body: commentBody } = body;

    if (!workflowId || !commentBody?.trim()) {
      return NextResponse.json(
        { error: "workflowId and body are required" },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const author = await db.user.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ id: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
      select: { id: true },
    });

    if (!author) {
      return NextResponse.json(
        { error: "Signed-in user was not found" },
        { status: 401 },
      );
    }

    const comment = await db.comment.create({
      data: {
        workflowId,
        body: commentBody.trim(),
        authorId: author.id,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    await sendSupervisorCommentNotifications(comment.id);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
