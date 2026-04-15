import { PrismaClient, Priority, Stage, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Delete in correct order - only delete tables that exist
  try {
    await prisma.activity.deleteMany();
  } catch {
    console.log("Skipping activity delete");
  }

  try {
    await prisma.task.deleteMany();
  } catch {
    console.log("Skipping task delete");
  }

  try {
    await prisma.comment.deleteMany();
  } catch {
    console.log("Skipping comment delete");
  }

  try {
    await prisma.workflow.deleteMany();
  } catch {
    console.log("Skipping workflow delete");
  }

  try {
    await prisma.user.deleteMany();
  } catch {
    console.log("Skipping user delete");
  }

  // Create users with PASSWORDS for authentication
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

  const themba = await prisma.user.create({
    data: {
      email: "themba@mediaonafrica.co.za",
      name: "Themba",
      role: Role.MANAGER,
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

  console.log("✅ Users created with passwords");

  const w1 = await prisma.workflow.create({
    data: {
      title: "Client Onboarding – TechCorp",
      description: "Full onboarding flow for TechCorp's enterprise account.",
      priority: Priority.HIGH,
      stage: Stage.IN_PROGRESS,
      team: "Sales",
      tags: JSON.stringify(["client", "onboarding"]),
      progress: 45,
      assigneeId: asanda.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  const w2 = await prisma.workflow.create({
    data: {
      title: "Database Migration – Production",
      description: "Migrate production DB to new infrastructure.",
      priority: Priority.HIGH,
      stage: Stage.BLOCKED,
      team: "Engineering",
      tags: JSON.stringify(["database", "critical"]),
      progress: 30,
      assigneeId: themba.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const w3 = await prisma.workflow.create({
    data: {
      title: "UI Redesign – Mobile App",
      description: "Complete redesign of the mobile app UI.",
      priority: Priority.MEDIUM,
      stage: Stage.REVIEW,
      team: "Design",
      tags: JSON.stringify(["design", "ui", "mobile"]),
      progress: 80,
      assigneeId: asanda.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const w4 = await prisma.workflow.create({
    data: {
      title: "API Integration – Stripe",
      description: "Integrate Stripe payment gateway into checkout flow.",
      priority: Priority.HIGH,
      stage: Stage.IN_PROGRESS,
      team: "Engineering",
      tags: JSON.stringify(["backend", "api", "payments"]),
      progress: 55,
      assigneeId: sizwe.id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  const w8 = await prisma.workflow.create({
    data: {
      title: "Design System v2.0",
      description: "Build a comprehensive design system for all products.",
      priority: Priority.MEDIUM,
      stage: Stage.IN_PROGRESS,
      team: "Design",
      tags: JSON.stringify(["design", "system"]),
      progress: 40,
      assigneeId: asanda.id,
      dueDate: new Date("2026-04-01"),
    },
  });

  const w9 = await prisma.workflow.create({
    data: {
      title: "Backend Performance Optimisation",
      description: "Reduce API response times by 40%.",
      priority: Priority.HIGH,
      stage: Stage.REVIEW,
      team: "Engineering",
      tags: JSON.stringify(["backend", "performance"]),
      progress: 90,
      assigneeId: themba.id,
      dueDate: new Date("2026-03-08"),
    },
  });

  const w11 = await prisma.workflow.create({
    data: {
      title: "Customer Feedback Portal",
      description: "Build a portal for customers to submit and track feedback.",
      priority: Priority.MEDIUM,
      stage: Stage.IN_PROGRESS,
      team: "Engineering",
      tags: JSON.stringify(["product", "feedback"]),
      progress: 25,
      assigneeId: sizwe.id,
      dueDate: new Date("2026-03-25"),
    },
  });

  const w12 = await prisma.workflow.create({
    data: {
      title: "Sales Pipeline Automation",
      description: "Automate lead scoring and follow-up sequences.",
      priority: Priority.HIGH,
      stage: Stage.TODO,
      team: "Sales",
      tags: JSON.stringify(["automation", "sales"]),
      progress: 5,
      assigneeId: shravan.id,
      dueDate: new Date("2026-04-05"),
    },
  });

  console.log("✅ Workflows created");

  await prisma.task.createMany({
    data: [
      {
        title: "Set up onboarding portal",
        workflowId: w1.id,
        assigneeId: asanda.id,
        completed: true,
      },
      {
        title: "Send welcome email sequence",
        workflowId: w1.id,
        assigneeId: asanda.id,
        completed: true,
      },
      {
        title: "Schedule kickoff call",
        workflowId: w1.id,
        assigneeId: asanda.id,
        completed: false,
      },
      {
        title: "Provide access credentials",
        workflowId: w1.id,
        assigneeId: asanda.id,
        completed: false,
      },
      {
        title: "Complete onboarding checklist",
        workflowId: w1.id,
        assigneeId: asanda.id,
        completed: false,
      },
      {
        title: "Backup existing database",
        workflowId: w2.id,
        assigneeId: themba.id,
        completed: true,
      },
      {
        title: "Provision new infrastructure",
        workflowId: w2.id,
        assigneeId: themba.id,
        completed: false,
      },
      {
        title: "Run migration scripts",
        workflowId: w2.id,
        assigneeId: themba.id,
        completed: false,
      },
      {
        title: "Validate data integrity",
        workflowId: w2.id,
        assigneeId: themba.id,
        completed: false,
      },
      {
        title: "Update connection strings",
        workflowId: w2.id,
        assigneeId: themba.id,
        completed: false,
      },
      {
        title: "Wireframes approved",
        workflowId: w3.id,
        assigneeId: asanda.id,
        completed: true,
      },
      {
        title: "Design review",
        workflowId: w3.id,
        assigneeId: asanda.id,
        completed: false,
      },
      {
        title: "Stripe account setup",
        workflowId: w4.id,
        assigneeId: sizwe.id,
        completed: true,
      },
      {
        title: "Implement payment flow",
        workflowId: w4.id,
        assigneeId: sizwe.id,
        completed: true,
      },
      {
        title: "Test webhooks",
        workflowId: w4.id,
        assigneeId: sizwe.id,
        completed: false,
      },
      {
        title: "Design system components",
        workflowId: w8.id,
        assigneeId: asanda.id,
        completed: true,
      },
      {
        title: "Document design tokens",
        workflowId: w8.id,
        assigneeId: asanda.id,
        completed: false,
      },
    ],
  });

  console.log("✅ Tasks created");

  await prisma.activity.createMany({
    data: [
      {
        action: "completed",
        details: "Database setup for Project Alpha",
        userId: sizwe.id,
        workflowId: w2.id,
        createdAt: new Date(Date.now() - 4 * 60 * 1000),
      },
      {
        action: "created",
        details: "New workflow: Client Onboarding – TechCorp",
        userId: shravan.id,
        workflowId: w1.id,
        createdAt: new Date(Date.now() - 17 * 60 * 1000),
      },
      {
        action: "updated",
        details: "Moved API Integration to In Progress",
        userId: themba.id,
        workflowId: w4.id,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        action: "reviewed",
        details: "Approved UI redesign mockups",
        userId: asanda.id,
        workflowId: w3.id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        action: "updated",
        details: "Stripe API integration progress to 55%",
        userId: sizwe.id,
        workflowId: w4.id,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Activities created");
  console.log("🎉 Database seeded successfully!");
  console.log("");
  console.log("📋 Login Credentials:");
  console.log(
    "   Themba (Supervisor):   themba@mediaonafrica.co.za / password123",
  );
  console.log(
    "   Asanda (Team Member):  asanda@mediaonafrica.co.za / password123",
  );
  console.log(
    "   Sizwe (Team Member):   sizwe@mediaonafrica.co.za / password123",
  );
  console.log(
    "   Shravan (Team Member): shravan@mediaonafrica.co.za / password123",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
