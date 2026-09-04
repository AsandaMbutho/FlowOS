import { PrismaClient, Priority, Stage } from "@prisma/client";

const prisma = new PrismaClient();

const restoredWorkflows = [
  {
    title: "CRM Real Estate Platform",
    description:
      "Developing a CRM system tailored for real estate operations — property listings, client tracking, and deal pipeline management.",
    priority: Priority.HIGH,
    stage: Stage.DONE,
    team: "Media on Africa",
    tags: ["crm", "real-estate", "platform"],
    progress: 55,
    assigneeName: "Asanda",
    dueDate: "2026-03-22",
    createdAt: "2026-03-18T13:16:53.673Z",
    tasks: [
      ["Design database schema for property listings", true],
      ["Build client management module", true],
      ["Implement deal pipeline view", false],
      ["Integrate property search and filter", false],
      ["Add reporting and analytics dashboard", false],
      ["User testing and feedback session", false],
    ],
  },
  {
    title: "FlowOS — Workflow Operating System",
    description:
      "Building a full-stack internal workflow management platform for Media on Africa. Features: Kanban board, notifications, analytics, team collaboration, global search, and mobile responsive design.",
    priority: Priority.HIGH,
    stage: Stage.IN_PROGRESS,
    team: "Media on Africa",
    tags: ["flowos", "internal-tool", "productivity"],
    progress: 75,
    assigneeName: "Asanda",
    dueDate: "2026-03-25",
    createdAt: "2026-03-18T13:16:53.710Z",
    tasks: [
      ["Dashboard with real-time stats", true],
      ["Workflows page with search and filters", true],
      ["Workflow detail page with tasks and comments", true],
      ["Kanban drag-and-drop board", true],
      ["Notifications with overdue detection", true],
      ["Analytics page with 6 live charts", true],
      ["Global search across workflows and tasks", true],
      ["Mobile responsive design", true],
      ["User authentication (login/logout)", false],
      ["Settings persistence", false],
      ["Present to Themba for review", false],
    ],
  },
  {
    title: "Stakeholder Feedback Collection",
    description:
      "Gathering structured feedback from colleagues and supervisors on current projects. Synthesising input for improvement and next sprint planning.",
    priority: Priority.MEDIUM,
    stage: Stage.DONE,
    team: "Media on Africa",
    tags: ["feedback", "review", "planning"],
    progress: 10,
    assigneeName: "Asanda",
    dueDate: "2026-03-22",
    createdAt: "2026-03-18T13:16:53.739Z",
    tasks: [
      ["Prepare feedback questionnaire", true],
      ["Send to Themba for CRM review", false],
      ["Send to Sizwe and Shravan for peer review", false],
      ["Compile and document all feedback", false],
    ],
  },
  {
    title: "CyberSafe Africa — Core Structure",
    description:
      "Setting up the foundational architecture for the CyberSafe Africa cybersecurity platform. Core structure, project scaffolding, and initial configuration complete.",
    priority: Priority.HIGH,
    stage: Stage.IN_PROGRESS,
    team: "Media on Africa",
    tags: ["cybersecurity", "cybersafe", "architecture"],
    progress: 100,
    assigneeName: "Sizwe",
    dueDate: "2026-03-10",
    createdAt: "2026-03-18T13:16:53.751Z",
    tasks: [
      ["Project scaffolding and repo setup", true],
      ["Define system architecture and tech stack", true],
      ["Connect frontend and backend", true],
      ["Environment configuration and deployment", true],
    ],
  },
  {
    title: "CyberSafe Africa — Frontend",
    description:
      "Built the user-facing pages: homepage, threats and safety tips section, and incident reporting form. All pages complete and tested.",
    priority: Priority.HIGH,
    stage: Stage.REVIEW,
    team: "Media on Africa",
    tags: ["cybersecurity", "frontend", "ui"],
    progress: 100,
    assigneeName: "Sizwe",
    dueDate: "2026-03-14",
    createdAt: "2026-03-18T13:16:53.770Z",
    tasks: [
      ["Build homepage with hero and overview sections", true],
      ["Build threats and safety tips section", true],
      ["Build incident reporting form", true],
      ["Responsive design and cross-browser testing", true],
    ],
  },
  {
    title: "CyberSafe Africa — Backend, API & Dashboard",
    description:
      "Backend API and database are operational. Dashboard shows live threat reports and security stats. Market research and company outreach ongoing in parallel.",
    priority: Priority.HIGH,
    stage: Stage.REVIEW,
    team: "Media on Africa",
    tags: ["cybersecurity", "backend", "api", "dashboard"],
    progress: 70,
    assigneeName: "Sizwe",
    dueDate: "2026-03-28",
    createdAt: "2026-03-18T13:16:53.785Z",
    tasks: [
      ["Set up backend API", true],
      ["Design and implement database schema", true],
      ["Build dashboard with threat stats and reports", true],
      ["Company outreach and market research", false],
      ["Security audit and penetration testing", false],
      ["Deploy to production environment", false],
    ],
  },
  {
    title: "E-Learning Platform — Content & Curriculum",
    description:
      "Developing curriculum content for the e-learning platform. Content stripped down and aligned to rubric structure. Currently building Grade 10 content blocks.",
    priority: Priority.HIGH,
    stage: Stage.IN_PROGRESS,
    team: "Media on Africa",
    tags: ["elearning", "curriculum", "education"],
    progress: 45,
    assigneeName: "Shravan",
    dueDate: "2026-03-29",
    createdAt: "2026-03-18T13:16:53.800Z",
    tasks: [
      ["Define curriculum scope and learning outcomes", true],
      ["Strip down and align content to rubric", true],
      ["Build Grade 10 content blocks", false],
      ["Build Grade 11 content blocks", false],
      ["Build Grade 12 content blocks", false],
      ["Peer review and content QA", false],
    ],
  },
  {
    title: "E-Learning Platform — Rubric Block Integration",
    description:
      "Integrating the rubric block system into the platform frontend and backend. Ensuring content renders correctly per grade and subject.",
    priority: Priority.HIGH,
    stage: Stage.IN_PROGRESS,
    team: "Media on Africa",
    tags: ["elearning", "rubric", "integration"],
    progress: 43,
    assigneeName: "Shravan",
    dueDate: "2026-03-31",
    createdAt: "2026-03-18T13:16:53.817Z",
    tasks: [
      ["Design rubric block data model", true],
      ["Build rubric block UI component", false],
      ["Integrate rubric blocks with Grade 10 content", false],
      ["Backend API for rubric content delivery", false],
      ["Testing and QA across grades", false],
      ["Grade 11 rubric", false],
      ["Call Fintech company", false],
    ],
  },
  {
    title: "Fintech meetomg",
    description: "Shravan needs to set up a meeting with the Fintech company.",
    priority: Priority.MEDIUM,
    stage: Stage.TODO,
    team: "Sales",
    tags: ["sales"],
    progress: 0,
    assigneeName: "Shravan",
    dueDate: "2026-03-23",
    createdAt: "2026-03-18T14:11:33.848Z",
    tasks: [],
  },
  {
    title: "CyberSafe",
    description:
      "Friday 20/3/26: Project still being refined , improving structure and integration.",
    priority: Priority.MEDIUM,
    stage: Stage.REVIEW,
    team: "Engineering",
    tags: ["engineering"],
    progress: 0,
    assigneeName: "Sizwe",
    dueDate: "2026-03-31",
    createdAt: "2026-03-23T13:28:50.752Z",
    tasks: [],
  },
  {
    title: "E-Learning",
    description: "Friday 20/03/26: still on grade 11 rubric",
    priority: Priority.HIGH,
    stage: Stage.IN_PROGRESS,
    team: "Engineering",
    tags: ["engineering"],
    progress: 0,
    assigneeName: "Shravan",
    dueDate: "2026-03-23",
    createdAt: "2026-03-23T13:29:54.945Z",
    tasks: [],
  },
  {
    title: "Team meeting",
    description: "Tuesday : team meeting. Updates about, CyberSafe & E-Learning",
    priority: Priority.HIGH,
    stage: Stage.DONE,
    team: "Operations",
    tags: ["operations"],
    progress: 0,
    assigneeName: "Asanda",
    dueDate: "2026-03-24",
    createdAt: "2026-03-23T13:42:19.867Z",
    tasks: [],
  },
  {
    title: "Social Services",
    description: "Shravan needs to find a new Social services organization.",
    priority: Priority.HIGH,
    stage: Stage.TODO,
    team: "Operations",
    tags: ["operations"],
    progress: 0,
    assigneeName: "Shravan",
    dueDate: "2026-03-27",
    createdAt: "2026-03-25T14:35:30.709Z",
    tasks: [],
  },
];

async function main() {
  let created = 0;
  let updated = 0;
  let tasksCreated = 0;
  let tasksUpdated = 0;

  for (const item of restoredWorkflows) {
    const assignee = await prisma.user.findFirst({
      where: { name: item.assigneeName },
      orderBy: { createdAt: "asc" },
    });

    const existing = await prisma.workflow.findFirst({
      where: { title: item.title },
      include: { tasks: true },
    });

    const data = {
      title: item.title,
      description: item.description,
      priority: item.priority,
      stage: item.stage,
      assigneeId: assignee?.id ?? null,
      team: item.team,
      tags: JSON.stringify(item.tags),
      dueDate: new Date(`${item.dueDate}T12:00:00.000Z`),
      progress: item.progress,
      createdAt: new Date(item.createdAt),
    };

    const workflow = existing
      ? await prisma.workflow.update({
          where: { id: existing.id },
          data,
          include: { tasks: true },
        })
      : await prisma.workflow.create({
          data,
          include: { tasks: true },
        });

    existing ? updated++ : created++;

    for (const [title, completed] of item.tasks) {
      const existingTask = workflow.tasks.find((task) => task.title === title);

      if (existingTask) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            completed: Boolean(completed),
            assigneeId: assignee?.id ?? null,
          },
        });
        tasksUpdated++;
        continue;
      }

      await prisma.task.create({
        data: {
          title: String(title),
          completed: Boolean(completed),
          workflowId: workflow.id,
          assigneeId: assignee?.id ?? null,
        },
      });
      tasksCreated++;
    }
  }

  const totals = {
    workflows: await prisma.workflow.count(),
    tasks: await prisma.task.count(),
  };

  console.log(
    JSON.stringify(
      { created, updated, tasksCreated, tasksUpdated, totals },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Restore failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
