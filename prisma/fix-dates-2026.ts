import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDates() {
  console.log("📅 Fixing workflow due dates to 2026...");

  const dateUpdates = [
    { title: "CRM Real Estate Platform", dueDate: new Date("2026-04-25") },
    {
      title: "FlowOS Workflow Operating System",
      dueDate: new Date("2026-04-30"),
    },
    {
      title: "Stakeholder Feedback Collection",
      dueDate: new Date("2026-05-20"),
    },
    {
      title: "CyberSafe Africa — Core Structure",
      dueDate: new Date("2026-03-30"),
    },
    { title: "CyberSafe Africa — Frontend", dueDate: new Date("2026-04-05") },
    {
      title: "CyberSafe Africa — Backend, API & Dashboard",
      dueDate: new Date("2026-05-05"),
    },
    {
      title: "E-Learning Platform — Content & Curriculum",
      dueDate: new Date("2026-05-10"),
    },
    {
      title: "E-Learning Platform — Rubric Block Integration",
      dueDate: new Date("2026-05-15"),
    },
  ];

  for (const update of dateUpdates) {
    await prisma.workflow.updateMany({
      where: { title: update.title },
      data: { dueDate: update.dueDate },
    });
    console.log(
      `✅ Updated: ${update.title} → ${update.dueDate.toLocaleDateString()}`,
    );
  }

  console.log("\n🎉 All dates fixed to 2026!");
}

fixDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
