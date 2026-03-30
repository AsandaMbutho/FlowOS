import { NextResponse } from "next/server";

export async function GET() {
  const insights = [
    "🎯 You're on track to complete 85% of your workflows this week!",
    "💡 Tip: Use daily updates to keep your supervisor informed.",
    "📊 Team velocity is up 12% from last week!",
    "🚀 Sizwe has been the most active contributor this week.",
    "⚠️ Security Audit workflow is blocked - needs attention.",
  ];

  return NextResponse.json({ insights });
}
