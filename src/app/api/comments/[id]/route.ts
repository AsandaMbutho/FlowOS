import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH - Edit a comment
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { body } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 },
      );
    }

    const comment = await db.comment.update({
      where: { id },
      data: { body: body.trim() },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("PATCH comment error:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a comment
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.commentMention.deleteMany({ where: { commentId: id } });
    await db.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE comment error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
