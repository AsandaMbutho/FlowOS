import { PrismaClient, Priority, Stage, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function cleanAndRestore() {
  console.log("🗑️ Cleaning all existing data...");

  // Delete ALL existing data in correct order
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.commentMention.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.workflowStageHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ All data cleared");

  console.log("🔄 Creating original Media on Africa users and workflows...");

  // Create users with correct emails
  const asanda = await prisma.user.create({
    data: {
      email: "asanda@mediaonafrica.co.za",
      name: "Asanda",
      role: Role.USER,
      password: await bcrypt.hash("password123", 10),
    },
  });

  const sizwe = await prisma.user.create({
    data: {
      email: "sizwe@mediaonafrica.co.za",
      name: "Sizwe",
      role: Role.USER,
      password: await bcrypt.hash("password123", 10),
    },
  });

  const shravan = await prisma.user.create({
    data: {
      email: "shravan@mediaonafrica.co.za",
      name: "Shravan",
      role: Role.USER,
      password: await bcrypt.hash("password123", 10),
    },
  });

  const themba = await prisma.user.create({
    data: {
      email: "themba@mediaonafrica.co.za",
      name: "Themba",
      role: Role.MANAGER,
      password: await bcrypt.hash("password123", 10),
    },
  });

  console.log("✅ Users created:");
  console.log(`   - Asanda (ID: ${asanda.id})`);
  console.log(`   - Sizwe (ID: ${sizwe.id})`);
  console.log(`   - Shravan (ID: ${shravan.id})`);
  console.log(`   - Themba (ID: ${themba.id})`);

  // Create EXACT original workflows
  const workflows = [
    // Asanda's workflows
    {
      title: "CRM Real Estate Platform",
      description: "Property listings, client tracking, deal pipeline",
      priority: Priority.HIGH,
      stage: Stage.IN_PROGRESS,
      team: "Engineering",
      tags: JSON.stringify(["crm", "real-estate"]),
      progress: 55,
      assigneeId: asanda.id,
      dueDate: new Date("2026-04-20"),
    },
    {
      title: "FlowOS Workflow Operating System",
      description: "The platform itself",
      priority: Priority.HIGH,
      stage: Stage.IN_PROGRESS,
      team: "Engineering",
      tags: JSON.stringify(["platform", "internal"]),
      progress: 75,
      assigneeId: asanda.id,
      dueDate: new Date("2026-04-15"),
    },
    {
      title: "Stakeholder Feedback Collection",
      description: "Gathering team and supervisor feedback",
      priority: Priority.MEDIUM,
      stage: Stage.TODO,
      team: "Product",
      tags: JSON.stringify(["feedback"]),
      progress: 10,
      assigneeId: asanda.id,
      dueDate: new Date("2026-04-25"),
    },
    // Sizwe's workflows
    {
      title: "CyberSafe Africa — Core Structure",
      description: "Architecture and scaffolding done",
      priority: Priority.HIGH,
      stage: Stage.DONE,
      team: "Engineering",
      tags: JSON.stringify(["cybersafe", "security"]),
      progress: 100,
      assigneeId: sizwe.id,
      dueDate: new Date("2026-03-30"),
    },
    {
      title: "CyberSafe Africa — Frontend",
      description: "Homepage, threats section, incident form built",
      priority: Priority.HIGH,
      stage: Stage.DONE,
      team: "Engineering",
      tags: JSON.stringify(["cybersafe", "frontend"]),
      progress: 100,
      assigneeId: sizwe.id,
      dueDate: new Date("2026-04-05"),
    },
    {
      title: "CyberSafe Africa — Backend, API & Dashboard",
      description: "Live threat stats dashboard operational",
      priority: Priority.HIGH,
      stage: Stage.IN_PROGRESS,
      team: "Engineering",
      tags: JSON.stringify(["cybersafe", "backend"]),
      progress: 70,
      assigneeId: sizwe.id,
      dueDate: new Date("2026-04-18"),
    },
    // Shravan's workflows
    {
      title: "E-Learning Platform — Content & Curriculum",
      description: "Grade 10 content blocks in progress",
      priority: Priority.MEDIUM,
      stage: Stage.IN_PROGRESS,
      team: "Education",
      tags: JSON.stringify(["elearning", "content"]),
      progress: 45,
      assigneeId: shravan.id,
      dueDate: new Date("2026-04-22"),
    },
    {
      title: "E-Learning Platform — Rubric Block Integration",
      description: "Integrating rubric blocks into platform",
      priority: Priority.MEDIUM,
      stage: Stage.IN_PROGRESS,
      team: "Engineering",
      tags: JSON.stringify(["elearning", "rubric"]),
      progress: 30,
      assigneeId: shravan.id,
      dueDate: new Date("2026-04-28"),
    },
  ];

  for (const workflow of workflows) {
    await prisma.workflow.create({ data: workflow });
    console.log(
      `✅ Created: ${workflow.title} (Assignee: ${workflow.assigneeId === asanda.id ? "Asanda" : workflow.assigneeId === sizwe.id ? "Sizwe" : "Shravan"})`,
    );
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 RESTORE COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n📊 FINAL SUMMARY:");
  console.log(`   Users: 4`);
  console.log(`   Workflows: ${workflows.length}`);
  console.log(`   - Asanda: 3 workflows`);
  console.log(`   - Sizwe: 3 workflows`);
  console.log(`   - Shravan: 2 workflows`);
  console.log(`   - Themba: 0 workflows (Supervisor)`);
  console.log("\n📋 LOGIN CREDENTIALS:");
  console.log(
    "   🔑 Themba (Supervisor):   themba@mediaonafrica.co.za / password123",
  );
  console.log(
    "   🔑 Asanda (Team Member):  asanda@mediaonafrica.co.za / password123",
  );
  console.log(
    "   🔑 Sizwe (Team Member):   sizwe@mediaonafrica.co.za / password123",
  );
  console.log(
    "   🔑 Shravan (Team Member): shravan@mediaonafrica.co.za / password123",
  );
}

cleanAndRestore()
  .catch((e) => {
    console.error("❌ Restore failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
