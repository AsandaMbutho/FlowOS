import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NotifType } from "@prisma/client";
import { checkOverdueWorkflows } from "@/lib/notifications";

// GET /api/notifications
export async function GET() {
  try {
    // Check for overdue workflows on each fetch (lightweight)
    await checkOverdueWorkflows();

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// POST /api/notifications
export async function POST(request: Request) {
  try {
    const { type, title, message, userId, workflowId } = await request.json();
    const notification = await db.notification.create({
      data: {
        type: type as NotifType,
        title,
        message,
        userId: userId ?? null,
        workflowId: workflowId ?? null,
      },
    });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  try {
    await db.notification.updateMany({ data: { read: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications — clear all
export async function DELETE() {
  try {
    await db.notification.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 },
    );
  }
}
