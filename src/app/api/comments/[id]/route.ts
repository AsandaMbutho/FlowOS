import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendMentionEmail } from "@/lib/email";
import { resolveMentionedUsers } from "@/lib/comment-mentions";

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

    // Mentions already recorded on this comment before the edit, so we only
    // notify users newly added by this edit, not ones mentioned already.
    const existingMentions = await db.commentMention.findMany({
      where: { commentId: id },
      select: { userId: true },
    });
    const existingMentionIds = new Set(
      existingMentions.map((m: { userId: string }) => m.userId),
    );

    const trimmedBody = body.trim();
    const mentionedUsers = await resolveMentionedUsers(trimmedBody);
    const newlyMentionedUsers = mentionedUsers.filter(
      (u) => !existingMentionIds.has(u.id),
    );

    const comment = await db.comment.update({
      where: { id },
      data: {
        body: trimmedBody,
        mentions: {
          deleteMany: {},
          create: mentionedUsers.map((u) => ({ userId: u.id })),
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        workflow: { select: { title: true } },
      },
    });

    // Notify only the newly mentioned users, and never the comment's own author.
    for (const user of newlyMentionedUsers) {
      if (user.id === comment.authorId) continue;

      await createNotification({
        type: "MENTION",
        title: "You were mentioned",
        message: `${comment.author?.name ?? "Someone"} mentioned you in "${comment.workflow.title}"`,
        userId: user.id,
        workflowId: comment.workflowId,
      });

      if (user.email) {
        await sendMentionEmail(
          user.email,
          comment.author?.name ?? "Someone",
          comment.workflow.title,
          trimmedBody,
          comment.workflowId,
        );
      }
    }

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
