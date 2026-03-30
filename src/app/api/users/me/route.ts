import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Temporary: hard-coded session user until auth is wired ──────────────────
// Replace `CURRENT_USER_EMAIL` with session?.user?.email once NextAuth is active
const CURRENT_USER_EMAIL = "asanda@mediaonafrica.co.za";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: CURRENT_USER_EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        // never return password
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/users/me]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
