export type Stage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Status =
  | "In Progress"
  | "Review"
  | "Blocked"
  | "Completed"
  | "To Do";

export interface Workflow {
  id: string;
  title: string;
  team: string;
  stage: Stage;
  status: Status;
  priority: Priority;
  progress: number;
  tasksLeft: number;
  tags: string[];
  assignee: {
    name: string;
    initials: string;
    color: string;
  };
  dueDate: string;
  lastUpdated: Date;
  description: string;
}

export const workflows: Workflow[] = [
  {
    id: "1",
    title: "Client Onboarding – TechCorp",
    team: "Sales",
    stage: "IN_PROGRESS",
    status: "In Progress",
    priority: "HIGH",
    progress: 45,
    tasksLeft: 5,
    tags: ["client", "onboarding"],
    assignee: {
      name: "Asanda",
      initials: "A",
      color: "from-purple-500 to-pink-500",
    },
    dueDate: "Tomorrow",
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
    description: "Full onboarding flow for TechCorp's enterprise account.",
  },
  {
    id: "2",
    title: "Database Migration – Production",
    team: "Engineering",
    stage: "BLOCKED",
    status: "Blocked",
    priority: "HIGH",
    progress: 30,
    tasksLeft: 8,
    tags: ["database", "critical"],
    assignee: {
      name: "Themba",
      initials: "T",
      color: "from-blue-500 to-cyan-500",
    },
    dueDate: "Overdue",
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    description: "Migrate production DB to new infrastructure.",
  },
  {
    id: "3",
    title: "UI Redesign – Mobile App",
    team: "Design",
    stage: "REVIEW",
    status: "Review",
    priority: "MEDIUM",
    progress: 80,
    tasksLeft: 2,
    tags: ["design", "ui", "mobile"],
    assignee: {
      name: "Asanda",
      initials: "A",
      color: "from-purple-500 to-pink-500",
    },
    dueDate: "Next week",
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000),
    description: "Complete redesign of the mobile app UI.",
  },
  {
    id: "4",
    title: "API Integration – Stripe",
    team: "Engineering",
    stage: "IN_PROGRESS",
    status: "In Progress",
    priority: "HIGH",
    progress: 55,
    tasksLeft: 4,
    tags: ["backend", "api", "payments"],
    assignee: {
      name: "Sizwe",
      initials: "S",
      color: "from-green-500 to-teal-500",
    },
    dueDate: "Friday",
    lastUpdated: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    description: "Integrate Stripe payment gateway into checkout flow.",
  },
  {
    id: "5",
    title: "Q1 Marketing Campaign",
    team: "Sales",
    stage: "TODO",
    status: "To Do",
    priority: "MEDIUM",
    progress: 10,
    tasksLeft: 12,
    tags: ["marketing", "campaign"],
    assignee: {
      name: "Lisa",
      initials: "L",
      color: "from-yellow-500 to-orange-500",
    },
    dueDate: "Mar 15",
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000),
    description: "Plan and execute Q1 marketing push across all channels.",
  },
  {
    id: "6",
    title: "Security Audit – Infrastructure",
    team: "Operations",
    stage: "TODO",
    status: "To Do",
    priority: "HIGH",
    progress: 0,
    tasksLeft: 15,
    tags: ["security", "audit"],
    assignee: {
      name: "Mike",
      initials: "M",
      color: "from-red-500 to-pink-500",
    },
    dueDate: "Mar 20",
    lastUpdated: new Date(Date.now() - 8 * 60 * 60 * 1000),
    description: "Full security audit of cloud infrastructure.",
  },
  {
    id: "7",
    title: "Employee Onboarding Flow",
    team: "Operations",
    stage: "IN_PROGRESS",
    status: "In Progress",
    priority: "LOW",
    progress: 70,
    tasksLeft: 3,
    tags: ["hr", "onboarding"],
    assignee: {
      name: "Lisa",
      initials: "L",
      color: "from-yellow-500 to-orange-500",
    },
    dueDate: "Mar 10",
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
    description: "Streamline the new employee onboarding process.",
  },
  {
    id: "8",
    title: "Design System v2.0",
    team: "Design",
    stage: "IN_PROGRESS",
    status: "In Progress",
    priority: "MEDIUM",
    progress: 40,
    tasksLeft: 9,
    tags: ["design", "system"],
    assignee: {
      name: "Asanda",
      initials: "A",
      color: "from-purple-500 to-pink-500",
    },
    dueDate: "Apr 1",
    lastUpdated: new Date(Date.now() - 20 * 60 * 1000),
    description: "Build a comprehensive design system for all products.",
  },
  {
    id: "9",
    title: "Backend Performance Optimisation",
    team: "Engineering",
    stage: "REVIEW",
    status: "Review",
    priority: "HIGH",
    progress: 90,
    tasksLeft: 1,
    tags: ["backend", "performance"],
    assignee: {
      name: "Themba",
      initials: "T",
      color: "from-blue-500 to-cyan-500",
    },
    dueDate: "Mar 8",
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000),
    description: "Reduce API response times by 40%.",
  },
  {
    id: "10",
    title: "Annual Report 2025",
    team: "Operations",
    stage: "DONE",
    status: "Completed",
    priority: "LOW",
    progress: 100,
    tasksLeft: 0,
    tags: ["report", "finance"],
    assignee: {
      name: "Mike",
      initials: "M",
      color: "from-red-500 to-pink-500",
    },
    dueDate: "Completed",
    lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000),
    description: "Compile and publish the 2025 annual report.",
  },
  {
    id: "11",
    title: "Customer Feedback Portal",
    team: "Engineering",
    stage: "IN_PROGRESS",
    status: "In Progress",
    priority: "MEDIUM",
    progress: 25,
    tasksLeft: 7,
    tags: ["product", "feedback"],
    assignee: {
      name: "Sizwe",
      initials: "S",
      color: "from-green-500 to-teal-500",
    },
    dueDate: "Mar 25",
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    description: "Build a portal for customers to submit and track feedback.",
  },
  {
    id: "12",
    title: "Sales Pipeline Automation",
    team: "Sales",
    stage: "TODO",
    status: "To Do",
    priority: "HIGH",
    progress: 5,
    tasksLeft: 11,
    tags: ["automation", "sales"],
    assignee: {
      name: "Shravan",
      initials: "S",
      color: "from-orange-500 to-red-500",
    },
    dueDate: "Apr 5",
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
    description: "Automate lead scoring and follow-up sequences.",
  },
];

// Helpers
export const getMyWorkflows = (name: string) =>
  workflows.filter((w) => w.assignee.name === name);

export const getWorkflowsByStage = (stage: Stage) =>
  workflows.filter((w) => w.stage === stage);
