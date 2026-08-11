import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();

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

    // Next.js 16 requires params to be awaited
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

    // TODO: Send email notification

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error approving request:", error);

    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}