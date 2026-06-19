import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";

// GET /api/workflows/[id]/files - Fetch all files for a workflow
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const files = await db.file.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("GET files error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}

// POST /api/workflows/[id]/files - Upload a file
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB" },
        { status: 400 },
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const path = `workflows/${id}/${filename}`;

    // Upload to Vercel Blob
    const blob = await put(path, file, {
      access: "private",
      addRandomSuffix: true,
    });

    // Save to database
    const savedFile = await db.file.create({
      data: {
        filename: blob.pathname,
        originalName: file.name,
        url: blob.url,
        size: file.size,
        mimeType: file.type,
        workflowId: id,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: "uploaded",
        details: `Uploaded file: ${file.name}`,
        workflowId: id,
      },
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

// DELETE /api/workflows/[id]/files - Delete a file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    // Get file from database
    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(file.filename);
    } catch (blobError) {
      console.error("Blob delete error:", blobError);
      // Continue with database deletion even if blob delete fails
    }

    // Delete from database
    await db.file.delete({ where: { id: fileId } });

    // Log activity
    await db.activity.create({
      data: {
        action: "deleted",
        details: `Deleted file: ${file.originalName}`,
        workflowId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
