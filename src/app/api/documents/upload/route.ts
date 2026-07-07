import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const project = (formData.get("project") as string) || "flowos";
    const workflowId = (formData.get("workflowId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Get user
    const user = await db.user.findFirst({
      where: { email: session.user.email || "" },
    });

    // Save document to database
    const document = await db.document.create({
      data: {
        name: file.name,
        fileUrl: blob.url,
        fileType: file.name.split(".").pop()?.toUpperCase() || "Other",
        fileSize: (file.size / 1024 / 1024).toFixed(1) + " MB",
        project: project.toLowerCase(),
        workflowId: workflowId,
        uploadedBy: user?.id || null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
