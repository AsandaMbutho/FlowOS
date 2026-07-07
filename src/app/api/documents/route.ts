import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const { name, fileUrl, fileType, fileSize, project, workflowId } =
      await request.json();

    if (!name || !fileUrl || !project) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user
    const user = await db.user.findFirst({
      where: { email: session?.user?.email || "" },
    });

    const document = await db.document.create({
      data: {
        name,
        fileUrl,
        fileType: fileType || "Other",
        fileSize: fileSize || "0 KB",
        project: project.toLowerCase(),
        workflowId: workflowId || null,
        uploadedBy: user?.id || null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project");
    const workflowId = searchParams.get("workflowId");

    const where: any = {};
    if (project) where.project = project.toLowerCase();
    if (workflowId) where.workflowId = workflowId;

    const documents = await db.document.findMany({
      where,
      include: {
        user: { select: { name: true } },
        workflow: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "No id provided" }, { status: 400 });
    }

    await db.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
