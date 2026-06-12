import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendMentionEmail } from "@/lib/email";

// GET /api/workflows/[id]/comments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const comments = await db.comment.findMany({
      where: { workflowId: id },
      include: {
        author: { select: { id: true, name: true } },
        mentions: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

// POST /api/workflows/[id]/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { body, authorName, mentionedNames } = await request.json();

    if (!body?.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 },
      );
    }

    // Resolve author
    const author = authorName
      ? await db.user.findFirst({ where: { name: authorName } })
      : null;

    // Resolve mentioned users
    const mentionedUsers = mentionedNames?.length
      ? await db.user.findMany({ where: { name: { in: mentionedNames } } })
      : [];

    // Get workflow for notification context
    const workflow = await db.workflow.findUnique({
      where: { id },
      select: { title: true },
    });

    const comment = await db.comment.create({
      data: {
        body: body.trim(),
        workflowId: id,
        authorId: author?.id ?? null,
        mentions: {
          create: mentionedUsers.map((u) => ({ userId: u.id })),
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        mentions: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    // Create in-app notifications AND send emails for mentions
    for (const user of mentionedUsers) {
      // Create in-app notification
      await createNotification({
        type: "MENTION",
        title: "You were mentioned",
        message: `${author?.name ?? "Someone"} mentioned you in "${workflow?.title}"`,
        userId: user.id,
        workflowId: id,
      });

      // Send email notification
      if (user.email) {
        const emailResult = await sendMentionEmail(
          user.email,
          author?.name ?? "Someone",
          workflow?.title ?? "a workflow",
          body.trim(),
          id,
        );

        if (emailResult.success) {
          console.log(
            `📧 Email sent to ${user.name} (${user.email}) for mention`,
          );
        } else {
          console.log(
            `⚠️ Failed to send email to ${user.name}: ${emailResult.error}`,
          );
        }
      } else {
        console.log(`⚠️ No email address for user: ${user.name}`);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST comments error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 },
    );
  }
}
