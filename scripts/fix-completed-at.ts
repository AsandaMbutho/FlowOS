import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Updating completed workflows...");

  try {
    const workflows = (await prisma.$queryRaw`
      SELECT id, title, "dueDate", "createdAt" 
      FROM "Workflow" 
      WHERE progress = 100 
      AND "completedAt" IS NULL
    `) as any[];

    console.log(`📊 Found ${workflows.length} workflows to update`);

    if (workflows.length === 0) {
      console.log("✅ No workflows to update!");
      return;
    }

    for (const workflow of workflows) {
      const completedAt = workflow.dueDate || workflow.createdAt || new Date();

      await prisma.$executeRaw`
        UPDATE "Workflow" 
        SET "completedAt" = ${completedAt} 
        WHERE id = ${workflow.id}
      `;

      console.log(
        `✅ Updated: "${workflow.title}" -> Completed on ${completedAt}`,
      );
    }

    console.log("🎉 All done!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
