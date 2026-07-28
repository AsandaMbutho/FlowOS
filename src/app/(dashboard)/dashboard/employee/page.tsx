"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
} from "lucide-react";

interface EmployeeData {
  myWorkflows: Array<{
    id: string;
    title: string;
    progress: number;
    stage: string;
    dueDate: Date;
    priority: string;
  }>;
  teamWorkflows: Array<{
    id: string;
    title: string;
    assigneeName: string;
    progress: number;
    stage: string;
  }>;
  myStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  recentUpdates: Array<{
    id: string;
    userName: string;
    action: string;
    workflowTitle: string;
    createdAt: Date;
  }>;
}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEmployeeData();
    }
  }, [status]);

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch("/api/dashboard/employee-stats");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "DONE":
        return "text-green-600 bg-green-100";
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-100";
      case "REVIEW":
        return "text-purple-600 bg-purple-100";
      case "BLOCKED":
        return "text-red-600 bg-red-100";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  // Show loading state while session is loading or data is loading
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {session?.user?.name || "User"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your work and your team.
        </p>
      </div>

      {/* My Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">My Workflows</p>
              <p className="text-2xl font-bold mt-1">
                {data?.myStats.total || 0}
              </p>
            </div>
            <div className="bg-teal-100 p-3 rounded-full">
              <Briefcase className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {data?.myStats.completed || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                {data?.myStats.inProgress || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* My Workflows Section */}
      <div className="bg-card rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-teal-600" />
              My Active Workflows
            </h2>
            <Link
              href="/workflows"
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="divide-y">
          {data?.myWorkflows?.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/workflows/${workflow.id}`}
              className="block p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2 min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {workflow.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStageColor(workflow.stage)}`}
                >
                  {workflow.stage.replace("_", " ")}
                </span>
              </div>
              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className={`flex items-center gap-1 ${getPriorityColor(workflow.priority)}`}
                  >
                    <AlertCircle className="h-3 w-3" />
                    {workflow.priority}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(workflow.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {workflow.progress}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {(!data?.myWorkflows || data.myWorkflows.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">
              No active workflows assigned to you.
            </div>
          )}
        </div>
      </div>

      {/* Team Workflows Section */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-teal-600" />
            Team Workflows
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            See what your colleagues are working on
          </p>
        </div>
        <div className="divide-y">
          {data?.teamWorkflows?.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/workflows/${workflow.id}`}
              className="block p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2 min-w-0">
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <h3 className="font-medium text-foreground">
                    {workflow.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    by {workflow.assigneeName}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStageColor(workflow.stage)}`}
                >
                  {workflow.stage.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <div className="flex-1 max-w-xs bg-muted rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {workflow.progress}%
                </span>
              </div>
            </Link>
          ))}
          {(!data?.teamWorkflows || data.teamWorkflows.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">
              No team workflows to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
