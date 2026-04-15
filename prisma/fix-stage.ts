import { PrismaClient, Stage } from "@prisma/client";

const prisma = new PrismaClient();

async function fix() {
  // Set all workflows with progress < 100% to IN_PROGRESS
  const result = await prisma.workflow.updateMany({
    where: { progress: { lt: 100 } },
    data: { stage: Stage.IN_PROGRESS },
  });

  console.log(`✅ Fixed ${result.count} workflows`);
  console.log(`   Only workflows with 100% progress will show as "Completed"`);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
