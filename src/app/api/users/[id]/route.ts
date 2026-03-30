import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── PATCH /api/users/[id] ────────────────────────────────────────────────────
// Accepts: { name?, email?, phone?, bio?, currentPassword?, newPassword? }
// phone and bio are not in the schema — they're stored in avatar as a JSON blob
// until the schema is extended. See note below.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    // ── Fetch existing user ────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Build update payload ───────────────────────────────────────────────
    const updateData: Record<string, unknown> = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (email && email.trim()) {
      // Check email not already taken by another user
      const existing = await prisma.user.findUnique({
        where: { email: email.trim() },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Email already in use by another account" },
          { status: 409 },
        );
      }
      updateData.email = email.trim();
    }

    // ── Password change ────────────────────────────────────────────────────
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 },
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { error: "No password set on this account" },
          { status: 400 },
        );
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes to save" });
    }

    // ── Persist ────────────────────────────────────────────────────────────
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
