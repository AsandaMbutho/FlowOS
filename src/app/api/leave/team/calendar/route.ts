import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // Format: "2026-07"
    const year = searchParams.get("year"); // Format: "2026"

    let startDate, endDate;

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const monthNum = parseInt(monthStr) - 1;
      startDate = new Date(year, monthNum, 1);
      endDate = new Date(year, monthNum + 1, 0);
    } else if (year) {
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get user's team members (you'll need to define team logic)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      // Add team relation if you have one
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For now, get all approved requests (you'll filter by team later)
    const requests = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Group by date
    const absences: Record<string, any[]> = {};

    requests.forEach((request) => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (!absences[dateStr]) {
          absences[dateStr] = [];
        }
        absences[dateStr].push({
          name: request.user.name,
          email: request.user.email,
          type: request.type,
          halfDay: request.isHalfDay,
          halfDayType: request.halfDayType,
        });
      }
    });

    return NextResponse.json({
      month:
        month ||
        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
      absences,
      stats: {
        totalRequests: requests.length,
        uniqueUsers: new Set(requests.map((r) => r.userId)).size,
      },
    });
  } catch (error) {
    console.error("Error fetching team calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch team calendar" },
      { status: 500 },
    );
  }
}
