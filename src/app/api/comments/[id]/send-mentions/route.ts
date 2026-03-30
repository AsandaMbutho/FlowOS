import { NextResponse } from "next/server";
import { sendMentionNotifications } from "@/lib/email-notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params to get the id
    const { id } = await params;

    const result = await sendMentionNotifications(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending mention emails:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send mention emails" },
      { status: 500 },
    );
  }
}
