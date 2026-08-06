import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET single request
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 },
    );
  }
}

// PUT - Update request (only if pending)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, startDate, endDate, reason, isHalfDay, halfDayType } = body;

    const request = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be updated" },
        { status: 400 },
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        isHalfDay,
        halfDayType,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}

// DELETE - Cancel request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved requests cannot be cancelled" },
        { status: 400 },
      );
    }

    await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "Request cancelled successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 },
    );
  }
}
