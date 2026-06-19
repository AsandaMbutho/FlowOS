import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const notification = await db.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(notification);
  } catch (error) {
    console.error("GET notification error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const notification = await db.notification.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json(notification);
  } catch (error) {
    console.error("PATCH notification error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications/[id] — delete single notification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.notification.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 },
    );
  }
}
