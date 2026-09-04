import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeaveRequestDecisionNotification } from "@/lib/email-notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { status, managerNote } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    if (user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only supervisors can review leave requests" },
        { status: 403 },
      );
    }

    // Next.js 16: params is a Promise
    const { id } = await params;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 },
      );
    }

    // TODO: Check if user is authorized (manager or admin)
    // For now, allow any authenticated user

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        managerNote,
        reviewerId: user.id,
        reviewedAt: new Date(),
      },
    });

    await sendLeaveRequestDecisionNotification(updated.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error approving request:", error);

    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}
