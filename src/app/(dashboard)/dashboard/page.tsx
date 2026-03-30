"use client";

import { useEffect, useState } from "react";
import { PipelineView } from "@/components/dashboard/pipeline-view";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  CalendarDays,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const CURRENT_USER = "Asanda";
const DATE_OPTIONS = ["Today", "This Week", "This Month", "Last 30 Days"];

interface Workflow {
  id: string;
  status: string;
  dueDate: string;
  tasksLeft: number;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("Today");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [myWorkflows, setMyWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    fetch(`/api/workflows?assignee=${CURRENT_USER}`)
      .then((r) => r.json())
      .then((data) => setMyWorkflows(Array.isArray(data) ? data : []))
      .catch(() => setMyWorkflows([]))
      .finally(() => setLoading(false));
  }, []);

  const myCompleted = myWorkflows.filter(
    (w) => w.status === "Completed",
  ).length;
  const myInProgress = myWorkflows.filter(
    (w) => w.status === "In Progress",
  ).length;
  const myOverdue = myWorkflows.filter((w) => w.dueDate === "Overdue").length;
  const myTasksLeft = myWorkflows.reduce((acc, w) => acc + w.tasksLeft, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {CURRENT_USER} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's a summary of your workflows and team activity.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <CalendarDays className="w-4 h-4" />
              {dateRange}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showDatePicker ? "rotate-180" : ""}`}
              />
            </Button>
            {showDatePicker && (
              <div className="absolute right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 py-1 min-w-[160px]">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDateRange(opt);
                      setShowDatePicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      dateRange === opt
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Link href="/workflows">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
              <Plus className="w-4 h-4" /> New Workflow
            </Button>
          </Link>
        </div>
      </div>

      <StatsCards />

      <div>
        <h2 className="text-base font-semibold mb-3 text-gray-700">
          My Summary
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your workflows…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Clock,
                bg: "bg-blue-100",
                iconColor: "text-blue-600",
                label: "In Progress",
                val: myInProgress,
              },
              {
                icon: CheckCircle,
                bg: "bg-green-100",
                iconColor: "text-green-600",
                label: "Completed",
                val: myCompleted,
              },
              {
                icon: AlertTriangle,
                bg: "bg-red-100",
                iconColor: "text-red-500",
                label: "Overdue",
                val: myOverdue,
              },
              {
                icon: null,
                bg: "bg-purple-100",
                iconColor: "text-purple-600",
                label: "Tasks Left",
                val: myTasksLeft,
              },
            ].map(({ icon: Icon, bg, iconColor, label, val }) => (
              <div
                key={label}
                className="bg-white border rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}
                >
                  {Icon ? (
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  ) : (
                    <span className={`${iconColor} font-bold text-sm`}>#</span>
                  )}
                </div>
                <div>
                  <div className="text-xl font-bold">{val}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <InsightsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">My Workflows</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Showing only workflows assigned to you
              </p>
            </div>
            <Link href="/workflows">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 text-sm h-8"
              >
                View all workflows →
              </Button>
            </Link>
          </div>
          <PipelineView />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Team Activity</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <ActivityFeed />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">Tip:</span> Head to
          Workflows to see all team workflows.
        </p>
        <Link href="/workflows">
          <Button variant="link" size="sm" className="text-blue-600 text-sm">
            Go to workflows →
          </Button>
        </Link>
      </div>
    </div>
  );
}
