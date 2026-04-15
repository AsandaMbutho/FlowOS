import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixCreationDates() {
  console.log("📅 Fixing workflow creation dates...");

  const workflows = await prisma.workflow.findMany();

  for (const workflow of workflows) {
    let createdAt: Date;
    let dueDate: Date | null = null;

    switch (workflow.title) {
      // Completed workflows (older)
      case "CyberSafe Africa — Core Structure":
        createdAt = new Date("2026-03-15");
        dueDate = new Date("2026-03-30");
        break;
      case "CyberSafe Africa — Frontend":
        createdAt = new Date("2026-03-20");
        dueDate = new Date("2026-04-05");
        break;

      // In progress workflows (mid-range)
      case "CRM Real Estate Platform":
        createdAt = new Date("2026-04-01");
        dueDate = new Date("2026-04-25");
        break;
      case "FlowOS Workflow Operating System":
        createdAt = new Date("2026-04-05");
        dueDate = new Date("2026-04-30");
        break;
      case "CyberSafe Africa — Backend, API & Dashboard":
        createdAt = new Date("2026-04-08");
        dueDate = new Date("2026-05-05");
        break;
      case "E-Learning Platform — Content & Curriculum":
        createdAt = new Date("2026-04-10");
        dueDate = new Date("2026-05-10");
        break;
      case "E-Learning Platform — Rubric Block Integration":
        createdAt = new Date("2026-04-12");
        dueDate = new Date("2026-05-15");
        break;

      // Newer workflow
      case "Stakeholder Feedback Collection":
        createdAt = new Date("2026-04-14");
        dueDate = new Date("2026-05-20");
        break;

      default:
        continue;
    }

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        createdAt: createdAt,
        dueDate: dueDate,
      },
    });

    console.log(
      `✅ ${workflow.title}: Created ${createdAt.toLocaleDateString()}, Due ${dueDate?.toLocaleDateString()}`,
    );
  }

  console.log("\n📅 Summary:");
  console.log("   CyberSafe Core: March 15 → Due March 30 (Completed)");
  console.log("   CyberSafe Frontend: March 20 → Due April 5 (Completed)");
  console.log("   CRM: April 1 → Due April 25");
  console.log("   FlowOS: April 5 → Due April 30");
  console.log("   CyberSafe Backend: April 8 → Due May 5");
  console.log("   E-Learning Content: April 10 → Due May 10");
  console.log("   E-Learning Rubric: April 12 → Due May 15");
  console.log("   Stakeholder Feedback: April 14 → Due May 20");
}

fixCreationDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
