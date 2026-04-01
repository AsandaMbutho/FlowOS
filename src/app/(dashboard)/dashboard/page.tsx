"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  FileText,
  FileSpreadsheet,
  File,
} from "lucide-react";
import Link from "next/link";

const DATE_OPTIONS = ["Today", "This Week", "This Month", "Last 30 Days"];

interface Workflow {
  id: string;
  title: string;
  status: string;
  priority: string;
  team: string;
  dueDate: string;
  progress: number;
  tasksLeft: number;
  assignee: { name: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const currentUser = session?.user?.name ?? "";

  const [dateRange, setDateRange] = useState("Today");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [myWorkflows, setMyWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/workflows?assignee=${encodeURIComponent(currentUser)}`)
      .then((r) => r.json())
      .then((data) => setMyWorkflows(Array.isArray(data) ? data : []))
      .catch(() => setMyWorkflows([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const myCompleted = myWorkflows.filter(
    (w) => w.status === "Completed",
  ).length;
  const myInProgress = myWorkflows.filter(
    (w) => w.status === "In Progress",
  ).length;
  const myOverdue = myWorkflows.filter((w) => w.dueDate === "Overdue").length;
  const myTasksLeft = myWorkflows.reduce((acc, w) => acc + w.tasksLeft, 0);

  async function fetchAllWorkflows(): Promise<Workflow[]> {
    const res = await fetch("/api/workflows");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  function download(filename: string, type: string, content: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportCSV() {
    const workflows = await fetchAllWorkflows();
    const headers = [
      "Title",
      "Status",
      "Priority",
      "Team",
      "Assignee",
      "Progress",
      "Due Date",
      "Tasks Left",
    ];
    const rows = workflows.map((w) => [
      w.title,
      w.status,
      w.priority,
      w.team,
      w.assignee?.name ?? "Unassigned",
      `${w.progress}%`,
      w.dueDate,
      w.tasksLeft,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    download("flowos-workflows.csv", "text/csv", csv);
    setShowExportMenu(false);
  }

  async function exportExcel() {
    const workflows = await fetchAllWorkflows();
    const headers = [
      "Title",
      "Status",
      "Priority",
      "Team",
      "Assignee",
      "Progress",
      "Due Date",
      "Tasks Left",
    ];
    const rows = workflows.map((w) => [
      w.title,
      w.status,
      w.priority,
      w.team,
      w.assignee?.name ?? "Unassigned",
      `${w.progress}%`,
      w.dueDate,
      w.tasksLeft,
    ]);
    const table = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body><table>
        <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        ${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
      </table></body></html>
    `;
    download("flowos-workflows.xls", "application/vnd.ms-excel", table);
    setShowExportMenu(false);
  }

  async function exportJSON() {
    const workflows = await fetchAllWorkflows();
    download(
      "flowos-workflows.json",
      "application/json",
      JSON.stringify(workflows, null, 2),
    );
    setShowExportMenu(false);
  }

  async function exportPDF() {
    const workflows = await fetchAllWorkflows();
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FlowOS — Workflow Report", 14, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-ZA", { dateStyle: "full" })}`,
      200,
      13,
    );

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const total = workflows.length;
    const completed = workflows.filter((w) => w.status === "Completed").length;
    const inProgress = workflows.filter(
      (w) => w.status === "In Progress",
    ).length;
    const overdue = workflows.filter((w) => w.dueDate === "Overdue").length;
    doc.text(
      `Total: ${total}   |   Completed: ${completed}   |   In Progress: ${inProgress}   |   Overdue: ${overdue}`,
      14,
      37,
    );

    autoTable(doc, {
      startY: 44,
      head: [
        [
          "Title",
          "Status",
          "Priority",
          "Team",
          "Assignee",
          "Progress",
          "Due Date",
          "Tasks Left",
        ],
      ],
      body: workflows.map((w) => [
        w.title,
        w.status,
        w.priority,
        w.team,
        w.assignee?.name ?? "Unassigned",
        `${w.progress}%`,
        w.dueDate,
        w.tasksLeft,
      ]),
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: { 0: { cellWidth: 60 } },
      styles: { overflow: "linebreak", cellPadding: 3 },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Media on Africa — FlowOS | Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 8,
      );
    }

    doc.save("flowos-workflows.pdf");
    setShowExportMenu(false);
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {currentUser} 👋
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

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" /> Export
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
              />
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 py-1 min-w-[180px]">
                <button
                  onClick={exportCSV}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-green-600" /> Export as CSV
                </button>
                <button
                  onClick={exportExcel}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
                  as Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-red-500" /> Export as PDF
                </button>
                <button
                  onClick={exportJSON}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 flex items-center gap-2"
                >
                  <File className="w-4 h-4 text-orange-500" /> Export as JSON
                </button>
              </div>
            )}
          </div>

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
