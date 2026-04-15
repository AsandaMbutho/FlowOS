import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function GET() {
  try {
    console.log("=== API: Fetching workflows for AI insights ===");

    const workflows = await prisma.workflow.findMany({
      include: {
        assignee: {
          select: { name: true },
        },
      },
    });

    console.log(`Found ${workflows.length} workflows`);

    if (!workflows || workflows.length === 0) {
      return NextResponse.json({
        insights: [
          "🎯 No workflows yet! Create your first workflow to get started.",
          "💡 Tip: Click 'New Workflow' in the top right corner.",
        ],
      });
    }

    // Build a clean summary of each workflow for the AI prompt
    const workflowSummaries = workflows.map((w) => {
      const assigneeName = w.assignee?.name || "Unassigned";

      let dueDateStr = "No due date";
      if (w.dueDate instanceof Date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(w.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays < 0)
          dueDateStr = `Overdue by ${Math.abs(diffDays)} day(s)`;
        else if (diffDays === 0) dueDateStr = "Due today";
        else dueDateStr = `Due in ${diffDays} day(s)`;
      } else if (typeof w.dueDate === "string") {
        dueDateStr = w.dueDate;
      }

      // FIXED: Using title (not name) and stage (not status)
      return `- "${w.title || "Unnamed"}" | Status: ${w.stage || "Unknown"} | Assignee: ${assigneeName} | Progress: ${w.progress ?? 0}% | Due: ${dueDateStr}`;
    });

    const workflowText = workflowSummaries.join("\n");

    console.log("Sending workflows to Anthropic AI...");

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are the FlowOS AI Intelligence Engine. Analyse the following workflow data and return exactly 6 concise insights for the team dashboard.

Rules:
- Each insight must be a single sentence, max 15 words.
- Start each with a relevant emoji (⚠️ for risk, 📊 for stats, 🏆 for wins, 📈 for forecasts, ⚡ for capacity, 🔁 for patterns).
- Reference specific workflow names, assignees, or numbers where relevant.
- Flag deadlines at risk, overloaded assignees, bottleneck stages, and completion forecasts.
- Return ONLY a JSON array of 6 strings. No markdown, no extra text.

Workflows:
${workflowText}`,
        },
      ],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = raw.replace(/```json|```/g, "").trim();
    const insights: string[] = JSON.parse(clean);

    console.log("AI insights generated:", insights);

    return NextResponse.json({ insights: insights.slice(0, 6) });
  } catch (error) {
    console.error("Insights API error:", error);

    return NextResponse.json({
      insights: [
        "🎯 AI Insights engine is online.",
        "📊 Update your workflows to see personalised insights.",
        "💡 Tip: Use daily updates to keep your team in sync.",
      ],
    });
  }
}
