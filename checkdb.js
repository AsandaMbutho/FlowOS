console.log("Starting...");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});
async function main() {
  console.log("Connecting...");
  const userCount = await prisma.user.count();
  console.log("User count:", userCount);
  const workflowCount = await prisma.workflow.count();
  console.log("Workflow count:", workflowCount);
}
main()
  .catch((e) => console.error("ERROR:", e.message))
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Done.");
  });
