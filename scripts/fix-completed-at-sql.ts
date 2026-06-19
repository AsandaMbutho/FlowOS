import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Finding completed workflows without completedAt...");

  try {
    // Check if completedAt column exists (PostgreSQL version)
    const columnCheck = (await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Workflow' 
      AND column_name = 'completedAt'
    `) as any[];

    if (columnCheck.length === 0) {
      console.log("⚠️ completedAt column doesn't exist yet. Adding it...");
      await prisma.$executeRaw`
        ALTER TABLE "Workflow" 
        ADD COLUMN "completedAt" TIMESTAMP
      `;
      console.log("✅ completedAt column added!");
    }

    // Find all completed workflows without completedAt
    const workflows = (await prisma.$queryRaw`
      SELECT id, title, "dueDate", "createdAt" 
      FROM "Workflow" 
      WHERE progress = 100 
      AND stage = 'DONE' 
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
    console.log("\n💡 If the column already exists, try running this instead:");
    console.log("   npx prisma studio");
    console.log(
      "   Then manually add completedAt dates to your completed workflows.",
    );
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
