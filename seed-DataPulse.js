const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("🧹 Clearing existing data...");
  await db.commentMention.deleteMany();
  await db.comment.deleteMany();
  await db.notification.deleteMany();
  await db.activity.deleteMany();
  await db.task.deleteMany();
  await db.workflow.deleteMany();
  await db.user.deleteMany();
  console.log("✅ Cleared.");

  console.log("👥 Creating team...");
  const themba = await db.user.create({
    data: {
      email: "themba@mediaonafrica.co.za",
      name: "Themba",
      role: "MANAGER",
    },
  });
  const asanda = await db.user.create({
    data: { email: "asanda@mediaonafrica.co.za", name: "Asanda", role: "USER" },
  });
  const sizwe = await db.user.create({
    data: { email: "sizwe@mediaonafrica.co.za", name: "Sizwe", role: "USER" },
  });
  const shravan = await db.user.create({
    data: {
      email: "shravan@mediaonafrica.co.za",
      name: "Shravan",
      role: "USER",
    },
  });
  console.log("✅ Team created.");

  console.log("📋 Creating workflows...");

  // ── ASANDA ──────────────────────────────────────────────────────────────
  const crm = await db.workflow.create({
    data: {
      title: "CRM Real Estate Platform",
      description:
        "Developing a CRM system tailored for real estate operations — property listings, client tracking, and deal pipeline management.",
      priority: "HIGH",
      stage: "IN_PROGRESS",
      assigneeId: asanda.id,
      team: "Media on Africa",
      tags: JSON.stringify(["crm", "real-estate", "platform"]),
      dueDate: new Date("2026-03-22"),
      progress: 55,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Design database schema for property listings",
        completed: true,
        workflowId: crm.id,
        assigneeId: asanda.id,
      },
      {
        title: "Build client management module",
        completed: true,
        workflowId: crm.id,
        assigneeId: asanda.id,
      },
      {
        title: "Implement deal pipeline view",
        completed: false,
        workflowId: crm.id,
        assigneeId: asanda.id,
      },
      {
        title: "Integrate property search and filter",
        completed: false,
        workflowId: crm.id,
        assigneeId: asanda.id,
      },
      {
        title: "Add reporting and analytics dashboard",
        completed: false,
        workflowId: crm.id,
        assigneeId: asanda.id,
      },
      {
        title: "User testing and feedback session",
        completed: false,
        workflowId: crm.id,
        assigneeId: asanda.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Status updated",
      details: "Moved to In Progress",
      userId: asanda.id,
      workflowId: crm.id,
    },
  });

  const flowos = await db.workflow.create({
    data: {
      title: "FlowOS — Workflow Operating System",
      description:
        "Building a full-stack internal workflow management platform for Media on Africa. Features: Kanban board, notifications, analytics, team collaboration, global search, and mobile responsive design.",
      priority: "HIGH",
      stage: "IN_PROGRESS",
      assigneeId: asanda.id,
      team: "Media on Africa",
      tags: JSON.stringify(["flowos", "internal-tool", "productivity"]),
      dueDate: new Date("2026-03-25"),
      progress: 75,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Dashboard with real-time stats",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Workflows page with search and filters",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Workflow detail page with tasks and comments",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Kanban drag-and-drop board",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Notifications with overdue detection",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Analytics page with 6 live charts",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Global search across workflows and tasks",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Mobile responsive design",
        completed: true,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "User authentication (login/logout)",
        completed: false,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Settings persistence",
        completed: false,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
      {
        title: "Present to Themba for review",
        completed: false,
        workflowId: flowos.id,
        assigneeId: asanda.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Progress updated",
      details: "75% complete — core features built",
      userId: asanda.id,
      workflowId: flowos.id,
    },
  });

  const feedback = await db.workflow.create({
    data: {
      title: "Stakeholder Feedback Collection",
      description:
        "Gathering structured feedback from colleagues and supervisors on current projects. Synthesising input for improvement and next sprint planning.",
      priority: "MEDIUM",
      stage: "TODO",
      assigneeId: asanda.id,
      team: "Media on Africa",
      tags: JSON.stringify(["feedback", "review", "planning"]),
      dueDate: new Date("2026-03-22"),
      progress: 10,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Prepare feedback questionnaire",
        completed: true,
        workflowId: feedback.id,
        assigneeId: asanda.id,
      },
      {
        title: "Send to Themba for CRM review",
        completed: false,
        workflowId: feedback.id,
        assigneeId: asanda.id,
      },
      {
        title: "Send to Sizwe and Shravan for peer review",
        completed: false,
        workflowId: feedback.id,
        assigneeId: asanda.id,
      },
      {
        title: "Compile and document all feedback",
        completed: false,
        workflowId: feedback.id,
        assigneeId: asanda.id,
      },
    ],
  });

  // ── SIZWE ────────────────────────────────────────────────────────────────
  const cyberCore = await db.workflow.create({
    data: {
      title: "CyberSafe Africa — Core Structure",
      description:
        "Setting up the foundational architecture for the CyberSafe Africa cybersecurity platform. Core structure, project scaffolding, and initial configuration complete.",
      priority: "HIGH",
      stage: "DONE",
      assigneeId: sizwe.id,
      team: "Media on Africa",
      tags: JSON.stringify(["cybersecurity", "cybersafe", "architecture"]),
      dueDate: new Date("2026-03-10"),
      progress: 100,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Project scaffolding and repo setup",
        completed: true,
        workflowId: cyberCore.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Define system architecture and tech stack",
        completed: true,
        workflowId: cyberCore.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Connect frontend and backend",
        completed: true,
        workflowId: cyberCore.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Environment configuration and deployment",
        completed: true,
        workflowId: cyberCore.id,
        assigneeId: sizwe.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Marked complete",
      details: "Core structure fully set up",
      userId: sizwe.id,
      workflowId: cyberCore.id,
    },
  });

  const cyberFrontend = await db.workflow.create({
    data: {
      title: "CyberSafe Africa — Frontend",
      description:
        "Built the user-facing pages: homepage, threats and safety tips section, and incident reporting form. All pages complete and tested.",
      priority: "HIGH",
      stage: "DONE",
      assigneeId: sizwe.id,
      team: "Media on Africa",
      tags: JSON.stringify(["cybersecurity", "frontend", "ui"]),
      dueDate: new Date("2026-03-14"),
      progress: 100,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Build homepage with hero and overview sections",
        completed: true,
        workflowId: cyberFrontend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Build threats and safety tips section",
        completed: true,
        workflowId: cyberFrontend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Build incident reporting form",
        completed: true,
        workflowId: cyberFrontend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Responsive design and cross-browser testing",
        completed: true,
        workflowId: cyberFrontend.id,
        assigneeId: sizwe.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Marked complete",
      details: "All frontend pages built and tested",
      userId: sizwe.id,
      workflowId: cyberFrontend.id,
    },
  });

  const cyberBackend = await db.workflow.create({
    data: {
      title: "CyberSafe Africa — Backend, API & Dashboard",
      description:
        "Backend API and database are operational. Dashboard shows live threat reports and security stats. Market research and company outreach ongoing in parallel.",
      priority: "HIGH",
      stage: "IN_PROGRESS",
      assigneeId: sizwe.id,
      team: "Media on Africa",
      tags: JSON.stringify(["cybersecurity", "backend", "api", "dashboard"]),
      dueDate: new Date("2026-03-28"),
      progress: 70,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Set up backend API",
        completed: true,
        workflowId: cyberBackend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Design and implement database schema",
        completed: true,
        workflowId: cyberBackend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Build dashboard with threat stats and reports",
        completed: true,
        workflowId: cyberBackend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Company outreach and market research",
        completed: false,
        workflowId: cyberBackend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Security audit and penetration testing",
        completed: false,
        workflowId: cyberBackend.id,
        assigneeId: sizwe.id,
      },
      {
        title: "Deploy to production environment",
        completed: false,
        workflowId: cyberBackend.id,
        assigneeId: sizwe.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Progress updated",
      details: "Backend and dashboard complete — outreach underway",
      userId: sizwe.id,
      workflowId: cyberBackend.id,
    },
  });

  // ── SHRAVAN ──────────────────────────────────────────────────────────────
  const eContent = await db.workflow.create({
    data: {
      title: "E-Learning Platform — Content & Curriculum",
      description:
        "Developing curriculum content for the e-learning platform. Content stripped down and aligned to rubric structure. Currently building Grade 10 content blocks.",
      priority: "HIGH",
      stage: "IN_PROGRESS",
      assigneeId: shravan.id,
      team: "DataPulse",
      tags: JSON.stringify(["elearning", "curriculum", "education"]),
      dueDate: new Date("2026-03-29"),
      progress: 45,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Define curriculum scope and learning outcomes",
        completed: true,
        workflowId: eContent.id,
        assigneeId: shravan.id,
      },
      {
        title: "Strip down and align content to rubric",
        completed: true,
        workflowId: eContent.id,
        assigneeId: shravan.id,
      },
      {
        title: "Build Grade 10 content blocks",
        completed: false,
        workflowId: eContent.id,
        assigneeId: shravan.id,
      },
      {
        title: "Build Grade 11 content blocks",
        completed: false,
        workflowId: eContent.id,
        assigneeId: shravan.id,
      },
      {
        title: "Build Grade 12 content blocks",
        completed: false,
        workflowId: eContent.id,
        assigneeId: shravan.id,
      },
      {
        title: "Peer review and content QA",
        completed: false,
        workflowId: eContent.id,
        assigneeId: shravan.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Progress updated",
      details: "Content aligned to rubric — Grade 10 in progress",
      userId: shravan.id,
      workflowId: eContent.id,
    },
  });

  const eRubric = await db.workflow.create({
    data: {
      title: "E-Learning Platform — Rubric Block Integration",
      description:
        "Integrating the rubric block system into the platform frontend and backend. Ensuring content renders correctly per grade and subject.",
      priority: "HIGH",
      stage: "IN_PROGRESS",
      assigneeId: shravan.id,
      team: "DataPulse",
      tags: JSON.stringify(["elearning", "rubric", "integration"]),
      dueDate: new Date("2026-03-31"),
      progress: 30,
    },
  });
  await db.task.createMany({
    data: [
      {
        title: "Design rubric block data model",
        completed: true,
        workflowId: eRubric.id,
        assigneeId: shravan.id,
      },
      {
        title: "Build rubric block UI component",
        completed: false,
        workflowId: eRubric.id,
        assigneeId: shravan.id,
      },
      {
        title: "Integrate rubric blocks with Grade 10 content",
        completed: false,
        workflowId: eRubric.id,
        assigneeId: shravan.id,
      },
      {
        title: "Backend API for rubric content delivery",
        completed: false,
        workflowId: eRubric.id,
        assigneeId: shravan.id,
      },
      {
        title: "Testing and QA across grades",
        completed: false,
        workflowId: eRubric.id,
        assigneeId: shravan.id,
      },
    ],
  });
  await db.activity.create({
    data: {
      action: "Status updated",
      details: "Rubric block integration started",
      userId: shravan.id,
      workflowId: eRubric.id,
    },
  });

  console.log("✅ All workflows and tasks created.");
  console.log("\n🎉 DataPulse is ready in FlowOS!");
  console.log("   👤 Themba  — Supervisor");
  console.log("   👤 Asanda  — CRM + FlowOS + Feedback");
  console.log("   👤 Sizwe   — CyberSafe Africa");
  console.log("   👤 Shravan — E-Learning Platform");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
