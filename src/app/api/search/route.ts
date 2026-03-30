import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2)
      return NextResponse.json({ workflows: [], tasks: [], comments: [] });

    const [workflows, tasks, comments] = await Promise.all([
      db.workflow.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { team: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          stage: true,
          team: true,
          priority: true,
        },
        take: 5,
      }),
      db.task.findMany({
        where: { title: { contains: q } },
        select: {
          id: true,
          title: true,
          completed: true,
          workflowId: true,
          workflow: { select: { title: true } },
        },
        take: 5,
      }),
      db.comment.findMany({
        where: { body: { contains: q } },
        select: {
          id: true,
          body: true,
          workflowId: true,
          workflow: { select: { title: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ workflows, tasks, comments });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { workflows: [], tasks: [], comments: [] },
      { status: 500 },
    );
  }
}
