"use client";
import { CalendarView } from "@/components/supervisor/calendar-view";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Zap,
  UserCheck,
  UserX,
  Calendar,
  Flag,
  GitBranch,
  Target,
  Award,
  Flame,
  Activity,
  PieChart,
  ArrowRight,
  Shield,
  Brain,
  AlertCircle,
} from "lucide-react";

interface Workflow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  dueDateIso?: string | null;
  assignedDateIso?: string | null;
  progress: number;
  createdAt: string;
  assignee: { name: string; email?: string };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  details: string;
  time: string;
  workflowTitle: string;
}

function formatDueDate(dateValue: any): string {
  if (!dateValue) return "No due date";
  if (dateValue === "Overdue") return "Overdue";
  if (dateValue === "No due date") return "No due date";

  if (typeof dateValue === "string") {
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const match = dateValue.match(/(\d+)\s+(\w+)/);
    if (match) {
      const day = parseInt(match[1]);
      const monthName = match[2].slice(0, 3);
      const month = months[monthName];
      if (month !== undefined) {
        return `${month + 1}/${day}/2026`;
      }
    }
  }

  try {
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
  } catch (e) {}

  return String(dateValue);
}

function isWorkflowOverdue(dueDate: any, progress: number): boolean {
  if (progress === 100) return false;
  if (dueDate === "Overdue") return true;
  if (!dueDate || dueDate === "No due date") return false;

  const dateStr = String(dueDate);
  const match = dateStr.match(/(\d+)\s+(\w+)/);
  if (match) {
    const day = parseInt(match[1]);
    const monthName = match[2].slice(0, 3);
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[monthName];
    if (month !== undefined) {
      const dueDateObj = new Date(2026, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDateObj < today;
    }
  }

  try {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }
  } catch (e) {}

  return false;
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

const SUPERVISOR_NAME = "Themba";

export default function SupervisorDashboard() {
  const { data: session } = useSession();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");

  useEffect(() => {
    async function fetchData() {
      try {
        const [workflowsRes, usersRes, activitiesRes] = await Promise.all([
          fetch("/api/workflows"),
          fetch("/api/users"),
          fetch("/api/activities?limit=20"),
        ]);
        const workflowsData = await workflowsRes.json();
        const usersData = await usersRes.json();
        const activitiesData = await activitiesRes.json();
        setWorkflows(Array.isArray(workflowsData) ? workflowsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const total = workflows.length;
  const completed = workflows.filter((w) => w.progress === 100).length;
  const inProgress = workflows.filter(
    (w) => w.progress > 0 && w.progress < 100,
  ).length;
  const notStarted = workflows.filter(
    (w) => w.progress === 0 || !w.progress,
  ).length;
  const avgProgress =
    total > 0
      ? Math.round(
          workflows.reduce((acc, w) => acc + (w.progress || 0), 0) / total,
        )
      : 0;

  const overdue = workflows.filter((w) =>
    isWorkflowOverdue(w.dueDate, w.progress),
  ).length;

  const highPriority = workflows.filter(
    (w) => w.priority === "High" || w.priority === "HIGH",
  ).length;
  const mediumPriority = workflows.filter(
    (w) => w.priority === "Medium" || w.priority === "MEDIUM",
  ).length;
  const lowPriority = workflows.filter(
    (w) => w.priority === "Low" || w.priority === "LOW",
  ).length;

  const workflowsWithRisk = workflows.map((w) => {
    let risk = 0;
    if (isWorkflowOverdue(w.dueDate, w.progress)) risk += 40;
    const daysUntilDue = 30;
    if (daysUntilDue < 3 && (w.progress || 0) < 30) risk += 30;
    if (daysUntilDue < 7 && (w.progress || 0) < 60) risk += 15;
    if (
      (w.priority === "High" || w.priority === "HIGH") &&
      (w.progress || 0) < 80
    )
      risk += 20;
    if (w.status === "Blocked") risk += 25;
    if (
      w.createdAt &&
      new Date(w.createdAt) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
      (w.progress || 0) < 50
    )
      risk += 15;
    return { ...w, riskScore: Math.min(risk, 100) };
  });

  const highRiskWorkflows = workflowsWithRisk.filter((w) => w.riskScore >= 50);
  const criticalRiskWorkflows = workflowsWithRisk.filter(
    (w) => w.riskScore >= 75,
  );
  const avgRiskScore =
    total > 0
      ? Math.round(
          workflowsWithRisk.reduce((acc, w) => acc + w.riskScore, 0) / total,
        )
      : 0;

  const workloadByUser: Record<
    string,
    { count: number; workflows: string[]; avgProgress: number }
  > = {};
  workflows.forEach((w) => {
    const name = w.assignee?.name || "Unassigned";
    if (!workloadByUser[name]) {
      workloadByUser[name] = { count: 0, workflows: [], avgProgress: 0 };
    }
    workloadByUser[name].count++;
    workloadByUser[name].workflows.push(w.title);
    workloadByUser[name].avgProgress =
      (workloadByUser[name].avgProgress + (w.progress || 0)) /
      workloadByUser[name].count;
  });

  const avgLoad =
    Object.values(workloadByUser).reduce((a, b) => a + b.count, 0) /
    Object.keys(workloadByUser).length;

  const overloadedUsers = Object.entries(workloadByUser)
    .filter(
      ([name, data]) =>
        data.count > avgLoad * 1.5 &&
        name !== "Unassigned" &&
        name !== SUPERVISOR_NAME,
    )
    .map(([name, data]) => ({
      name,
      count: data.count,
      workflows: data.workflows,
      avgProgress: Math.round(data.avgProgress),
    }));

  const underloadedUsers = Object.entries(workloadByUser)
    .filter(
      ([name, data]) =>
        data.count < avgLoad * 0.5 &&
        name !== "Unassigned" &&
        name !== SUPERVISOR_NAME,
    )
    .map(([name, data]) => ({
      name,
      count: data.count,
      workflows: data.workflows,
      avgProgress: Math.round(data.avgProgress),
    }));

  const stageCounts: Record<string, number> = {
    "To Do": 0,
    "In Progress": 0,
    Review: 0,
    Blocked: 0,
    Completed: 0,
  };
  workflows.forEach((w) => {
    if (stageCounts[w.status] !== undefined) stageCounts[w.status]++;
  });

  const bottleneckStages = Object.entries(stageCounts)
    .filter(([stage, count]) => {
      if (stage === "Blocked") return count > 2;
      if (stage === "Review") return count > 3;
      return false;
    })
    .map(([stage, count]) => ({ stage, count }));

  const onTrackCount = workflows.filter(
    (w) => w.progress >= 50 && w.progress !== 100,
  ).length;
  const atRiskCount = workflows.filter(
    (w) => w.progress < 50 && w.progress !== 100,
  ).length;
  const likelyToComplete = workflows.filter(
    (w) => w.progress >= 50 && w.progress !== 100,
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const velocity = Math.round((completed / 7) * 100) / 100;

  let topPerformer = "";
  let topPerformerCount = 0;
  for (const [name, data] of Object.entries(workloadByUser)) {
    if (
      data.count > topPerformerCount &&
      name !== "Unassigned" &&
      name !== SUPERVISOR_NAME
    ) {
      topPerformerCount = data.count;
      topPerformer = name;
    }
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentCompleted = workflows.filter(
    (w) =>
      w.progress === 100 && w.createdAt && new Date(w.createdAt) > oneWeekAgo,
  ).length;
  const previousCompleted = workflows.filter(
    (w) =>
      w.progress === 100 &&
      w.createdAt &&
      new Date(w.createdAt) > twoWeeksAgo &&
      new Date(w.createdAt) <= oneWeekAgo,
  ).length;
  const trend =
    previousCompleted > 0
      ? ((recentCompleted - previousCompleted) / previousCompleted) * 100
      : recentCompleted > 0
        ? 100
        : 0;

  const commonIssues = [];
  if (stageCounts["Blocked"] > 2)
    commonIssues.push("Multiple workflows blocked in Review stage");
  if (overdue > 3) commonIssues.push("Team consistently missing deadlines");
  if (highPriority > 5 && completed < highPriority)
    commonIssues.push("High-priority backlog growing");
  if (avgRiskScore > 50)
    commonIssues.push("Elevated risk scores across active workflows");

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold tracking-tight">
              Supervisor Dashboard — {SUPERVISOR_NAME}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time team performance, risk detection, capacity insights, and
            predictive analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["week", "month", "quarter"].map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedTimeframe === tf
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tf === "week"
                ? "This Week"
                : tf === "month"
                  ? "This Month"
                  : "This Quarter"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground">{total}</div>
              <div className="text-sm text-muted-foreground">
                Total Workflows
              </div>
            </div>
            <div className="stat-icon bg-blue-50 dark:bg-blue-950/30">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">
                {completed}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="stat-icon bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-600">
                {inProgress}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="stat-icon bg-amber-50 dark:bg-amber-950/30">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600">{overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
            <div className="stat-icon bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {avgProgress}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Progress</div>
            </div>
            <div className="stat-icon bg-teal-50 dark:bg-teal-950/30">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {completionRate}%
              </div>
              <div className="text-sm text-muted-foreground">
                Completion Rate
              </div>
            </div>
            <div className="stat-icon bg-purple-50 dark:bg-purple-950/30">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-depth p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs">Team Velocity</span>
          </div>
          <div className="text-2xl font-bold">{velocity}</div>
          <div className="text-xs text-muted-foreground">workflows/day avg</div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs">Top Performer</span>
          </div>
          <div className="text-lg font-bold truncate">
            {topPerformer || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {topPerformerCount} workflows
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Weekly Trend</span>
          </div>
          <div
            className={`text-2xl font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {trend >= 0 ? `+${Math.round(trend)}%` : `${Math.round(trend)}%`}
          </div>
          <div className="text-xs text-muted-foreground">vs previous week</div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Brain className="w-4 h-4" />
            <span className="text-xs">Avg Risk Score</span>
          </div>
          <div
            className={`text-2xl font-bold ${avgRiskScore >= 50 ? "text-red-600" : avgRiskScore >= 30 ? "text-amber-600" : "text-emerald-600"}`}
          >
            {avgRiskScore}
          </div>
          <div className="text-xs text-muted-foreground">
            across all workflows
          </div>
        </div>
      </div>

      {(criticalRiskWorkflows.length > 0 || highRiskWorkflows.length > 0) && (
        <div
          className={`rounded-xl p-5 border ${
            criticalRiskWorkflows.length > 0
              ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle
              className={`w-5 h-5 ${criticalRiskWorkflows.length > 0 ? "text-red-600" : "text-amber-600"}`}
            />
            <h2 className="font-semibold text-foreground">
              {criticalRiskWorkflows.length > 0
                ? "🚨 CRITICAL RISK ALERT"
                : "⚠️ Risk Alert"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {criticalRiskWorkflows.length > 0
                ? "Immediate action required"
                : "Review recommended"}
            </span>
          </div>
          <div className="space-y-3">
            {criticalRiskWorkflows.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{w.title}</p>
                    <span className="badge badge-high text-xs">
                      Risk: {w.riskScore}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assignee: {w.assignee?.name || "Unassigned"} · Due:{" "}
                    {formatDueDate(w.dueDate)} · Progress: {w.progress}%
                  </p>
                </div>
                <Link href={`/workflows/${w.id}`}>
                  <button className="text-red-600 text-sm hover:underline flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card-depth p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">
                Team Capacity Analysis
              </h2>
            </div>

            {overloadedUsers.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1 text-sm font-medium text-red-600 mb-2">
                  <UserX className="w-4 h-4" /> Overloaded Members
                </div>
                {overloadedUsers.map((user) => (
                  <div
                    key={user.name}
                    className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-red-600">
                        {user.count} tasks ({user.avgProgress}% avg)
                      </span>
                    </div>
                    <div className="progress-bar mt-2">
                      <div
                        className="progress-bar-fill bg-red-500"
                        style={{
                          width: `${Math.min(100, (user.count / avgLoad) * 50)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {underloadedUsers.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 mb-2">
                  <UserCheck className="w-4 h-4" /> Available Capacity
                </div>
                {underloadedUsers.map((user) => (
                  <div
                    key={user.name}
                    className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-emerald-600">
                        {user.count} tasks
                      </span>
                    </div>
                    <div className="progress-bar mt-2">
                      <div
                        className="progress-bar-fill bg-emerald-500"
                        style={{ width: `${(user.count / avgLoad) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-3">
                Workload Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(workloadByUser)
                  .filter(
                    ([name]) =>
                      name !== SUPERVISOR_NAME && name !== "Unassigned",
                  )
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([name, data]) => (
                    <div key={name}>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent"></span>
                          {name}
                        </span>
                        <span className="text-muted-foreground">
                          {data.count} workflows
                        </span>
                      </div>
                      <div className="progress-bar mt-1">
                        <div
                          className={`progress-bar-fill ${data.count > avgLoad * 1.3 ? "bg-red-500" : data.count < avgLoad * 0.7 ? "bg-emerald-500" : "bg-teal-500"}`}
                          style={{
                            width: `${(data.count / (avgLoad * 2)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="card-depth p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-foreground">
                Bottleneck & Flow Analysis
              </h2>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium mb-3">
                Workflow Stage Distribution
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(stageCounts).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="text-center p-2 bg-muted/30 rounded-lg"
                  >
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">{stage}</div>
                  </div>
                ))}
              </div>
            </div>

            {bottleneckStages.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-sm">
                    Bottlenecks Detected
                  </span>
                </div>
                {bottleneckStages.map((b) => (
                  <div
                    key={b.stage}
                    className="flex justify-between items-center mb-2"
                  >
                    <span>{b.stage} Stage</span>
                    <span className="badge badge-medium">
                      {b.count} workflows stuck
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Flow Health</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Flow Efficiency</span>
                    <span>
                      {Math.round((completed / (total - notStarted)) * 100) ||
                        0}
                      %
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, (completed / (total - notStarted)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-depth p-5 bg-gradient-to-br from-accent/5 to-accent/10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Weekly Forecast</h2>
              <span className="badge badge-progress text-xs">
                AI Prediction
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {onTrackCount}
                </div>
                <div className="text-xs text-muted-foreground">On Track</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {atRiskCount}
                </div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">
                  {likelyToComplete}
                </div>
                <div className="text-xs text-muted-foreground">
                  Forecast Complete
                </div>
              </div>
            </div>

            <div className="progress-bar mb-2">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(onTrackCount / Math.max(total, 1)) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Based on current velocity of {velocity} workflows/day
            </p>
          </div>

          <div className="card-depth p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-foreground">
                Priority Tasks (Risk-Ranked)
              </h2>
            </div>
            <div className="space-y-3">
              {workflowsWithRisk
                .filter((w) => w.progress < 100)
                .sort((a, b) => b.riskScore - a.riskScore)
                .slice(0, 5)
                .map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-accent w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.assignee?.name} · {task.progress}% complete ·
                          Due: {formatDueDate(task.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge ${task.riskScore >= 75 ? "badge-high" : task.riskScore >= 50 ? "badge-medium" : "badge-low"}`}
                      >
                        Risk: {task.riskScore}%
                      </span>
                      <Link href={`/workflows/${task.id}`}>
                        <button className="text-accent text-sm hover:underline">
                          View →
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              {workflowsWithRisk.filter((w) => w.progress < 100).length ===
                0 && (
                <p className="text-center text-muted-foreground py-8">
                  No active workflows. All caught up! 🎉
                </p>
              )}
            </div>
          </div>

          <div className="card-depth p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-foreground">
                Pattern Recognition & AI Insights
              </h2>
            </div>
            <div className="space-y-3">
              {commonIssues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                  <p className="text-sm text-muted-foreground">{issue}</p>
                </div>
              ))}
              {commonIssues.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No significant patterns detected. Team performance is stable.
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-accent mt-0.5" />
                  <p className="text-sm">
                    <span className="font-medium">Recommendation:</span>{" "}
                    {overdue > 5
                      ? "Focus on clearing overdue items before starting new workflows."
                      : overloadedUsers.length > 0
                        ? `Consider redistributing tasks from ${overloadedUsers[0].name} to balance workload.`
                        : "Team is performing well. Maintain current velocity and monitor bottlenecks."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-depth p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-foreground">
                Recent Team Activity
              </h2>
              <span className="badge badge-progress text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 p-2 hover:bg-muted/30 rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3 h-3 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">{activity.user}</span>
                      <span className="text-muted-foreground ml-1">
                        {activity.action}
                      </span>
                      <span className="font-medium text-accent ml-1">
                        {activity.workflowTitle}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.time)}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="card-depth p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">Workflow Calendar</h2>
          <span className="badge badge-progress text-xs">
            Click on any event to view
          </span>
        </div>
        <CalendarView workflows={workflows} />
      </div>

      {/* Priority Distribution Chart */}
      <div className="card-depth p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Workflow Priority Distribution
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {highPriority}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
            <div className="progress-bar mt-2">
              <div
                className="progress-bar-fill bg-red-500"
                style={{
                  width: `${(highPriority / Math.max(total, 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {mediumPriority}
            </div>
            <div className="text-sm text-muted-foreground">Medium Priority</div>
            <div className="progress-bar mt-2">
              <div
                className="progress-bar-fill bg-amber-500"
                style={{
                  width: `${(mediumPriority / Math.max(total, 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {lowPriority}
            </div>
            <div className="text-sm text-muted-foreground">Low Priority</div>
            <div className="progress-bar mt-2">
              <div
                className="progress-bar-fill bg-emerald-500"
                style={{
                  width: `${(lowPriority / Math.max(total, 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
