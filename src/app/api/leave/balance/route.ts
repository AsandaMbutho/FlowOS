import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        leaveBalance: true,
        leaveRequests: {
          where: {
            status: { in: ["APPROVED"] },
            startDate: {
              gte: new Date(new Date().getFullYear(), 0, 1),
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate used days
    const usedDays = {
      ANNUAL: 0,
      SICK: 0,
      PERSONAL: 0,
    };

    user.leaveRequests.forEach((request) => {
      const days = calculateWorkingDays(request.startDate, request.endDate);
      if (request.type === "ANNUAL") usedDays.ANNUAL += days;
      if (request.type === "SICK") usedDays.SICK += days;
      if (request.type === "PERSONAL") usedDays.PERSONAL += days;
    });

    const balance = user.leaveBalance || {
      annualEntitlement: 20,
      annualCarryOver: 0,
      sickEntitlement: 10,
      sickCarryOver: 0,
      personalEntitlement: 3,
    };

    return NextResponse.json({
      annual: {
        total: balance.annualEntitlement + balance.annualCarryOver,
        used: usedDays.ANNUAL,
        remaining:
          balance.annualEntitlement + balance.annualCarryOver - usedDays.ANNUAL,
      },
      sick: {
        total: balance.sickEntitlement + balance.sickCarryOver,
        used: usedDays.SICK,
        remaining:
          balance.sickEntitlement + balance.sickCarryOver - usedDays.SICK,
      },
      personal: {
        total: balance.personalEntitlement,
        used: usedDays.PERSONAL,
        remaining: balance.personalEntitlement - usedDays.PERSONAL,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 },
    );
  }
}

function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      // Exclude weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}
