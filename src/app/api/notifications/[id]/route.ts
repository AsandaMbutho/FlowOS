import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const notification = await db.notification.findUnique({
      where: { id: params.id },
    });
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(notification);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const notification = await db.notification.update({
      where: { id: params.id },
      data: { read: true },
    });
    return NextResponse.json(notification);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications/[id] — delete single notification
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await db.notification.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 },
    );
  }
}
