import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  decideLeaveRequest,
  getPendingLeaveRequests,
} from "@/lib/leave-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only supervisors can review leave requests.
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user || user.role !== "MANAGER") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only supervisors can approve/reject leave requests",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const {
      leaveRequestId,
      status,
      managerNote,
    } = body;

    // Validate request
    if (
      !leaveRequestId ||
      !status ||
      !["APPROVED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid status or missing leaveRequestId. Status must be APPROVED or REJECTED.",
        },
        { status: 400 },
      );
    }

    const updated = await decideLeaveRequest(leaveRequestId, {
      status,
      reviewerId: user.id,
      managerNote,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error deciding leave request:", error);

    return NextResponse.json(
      { error: "Failed to process leave request decision" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only supervisors can see pending leave requests.
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user || user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only supervisors can see pending leave requests" },
        { status: 403 },
      );
    }

    const pendingRequests = await getPendingLeaveRequests();

    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error(
      "Error fetching pending leave requests:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to fetch pending leave requests" },
      { status: 500 },
    );
  }
}
