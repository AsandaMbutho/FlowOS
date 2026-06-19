import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Direct fix for completed workflows...");

  try {
    // Direct update using SQL
    const result = await prisma.$executeRaw`
      UPDATE "Workflow" 
      SET "completedAt" = "dueDate" 
      WHERE progress = 100 
      AND stage = 'DONE' 
      AND "completedAt" IS NULL
    `;

    console.log(`✅ Updated ${result} workflows`);

    // Verify
    const workflows = (await prisma.$queryRaw`
      SELECT id, title, progress, stage, "dueDate", "completedAt" 
      FROM "Workflow" 
      WHERE progress = 100 
      AND stage = 'DONE'
    `) as any[];

    console.log(`\n📊 Found ${workflows.length} completed workflows:`);
    for (const w of workflows) {
      console.log(`  - ${w.title}: completedAt = ${w.completedAt}`);
    }

    console.log("\n🎉 All done!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
