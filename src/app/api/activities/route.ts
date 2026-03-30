import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const activities = await db.activity.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        workflow: { select: { id: true, title: true } },
      },
    });

    const formatted = activities.map((a) => ({
      id: a.id,
      user: a.user?.name ?? "System",
      action: detectAction(a.action),
      details: a.details ?? a.action,
      time: a.createdAt.toISOString(),
      userColor: colorForName(a.user?.name ?? ""),
      workflowId: a.workflowId,
      workflowTitle: a.workflow?.title ?? "",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/activities error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

function detectAction(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("complet")) return "completed";
  if (a.includes("creat")) return "created";
  if (a.includes("review")) return "reviewed";
  if (a.includes("block")) return "blocked";
  if (a.includes("updat") || a.includes("progress")) return "updated";
  return "updated";
}

function colorForName(name: string): string {
  const map: Record<string, string> = {
    Asanda: "from-purple-500 to-pink-500",
    Sizwe: "from-blue-500 to-cyan-500",
    Shravan: "from-orange-500 to-red-500",
    Themba: "from-teal-500 to-green-500",
  };
  return map[name] ?? "from-gray-400 to-gray-500";
}
