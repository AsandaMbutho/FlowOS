import { NextResponse } from "next/server";
import { checkAndSendOverdueNotifications } from "@/lib/email-notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow authenticated users with admin/manager role
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkAndSendOverdueNotifications();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in email processing endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process emails" },
      { status: 500 },
    );
  }
}
