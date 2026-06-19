"use client";

import { Suspense } from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  ChevronDown,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react";
import { useSession } from "next-auth/react";

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Status = "In Progress" | "Review" | "Blocked" | "Completed" | "To Do";
type Stage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";

interface Assignee {
  name: string;
  initials: string;
  color: string;
}
interface Workflow {
  id: string;
  title: string;
  description: string;
  team: string;
  stage: Stage;
  status: Status;
  priority: Priority;
  progress: number;
  tasksLeft: number;
  tags: string[];
  assignee: Assignee;
  dueDate: string;
  completedAt?: string | null;
}

const STATUS_CFG: Record<Status, { bg: string; text: string }> = {
  "In Progress": { bg: "bg-[#d1fae5]", text: "text-[#0f1f3d]" },
  Review: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Blocked: { bg: "bg-red-100", text: "text-red-700" },
  Completed: { bg: "bg-green-100", text: "text-green-700" },
  "To Do": { bg: "bg-gray-100", text: "text-gray-600" },
};

const PRIORITY_CFG: Record<
  Priority,
  { bg: string; text: string; border: string }
> = {
  HIGH: { bg: "bg-red-100", text: "text-red-700", border: "border-l-red-500" },
  MEDIUM: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-l-yellow-500",
  },
  LOW: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-l-green-500",
  },
};

const progressColor = (p: number) =>
  p === 100
    ? "bg-green-500"
    : p >= 70
      ? "bg-[#10b981]"
      : p >= 40
        ? "bg-yellow-500"
        : "bg-red-400";

const TEAM_MEMBERS = ["Asanda", "Sizwe", "Themba", "Shravan", "Lisa", "Mike"];
const TEAMS: string[] = ["Engineering", "Design", "Sales", "Operations"];
const STATUSES: Status[] = [
  "In Progress",
  "Review",
  "Blocked",
  "Completed",
  "To Do",
];
const PRIORITIES: Priority[] = ["HIGH", "MEDIUM", "LOW"];

interface FormState {
  title: string;
  description: string;
  team: string;
  assigneeName: string;
  priority: Priority;
  dueDate: string;
  status: Status;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  team: "Engineering",
  assigneeName: "Asanda",
  priority: "MEDIUM",
  dueDate: "",
  status: "To Do",
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// Move the main component logic into a separate component that uses useSearchParams
function WorkflowsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const currentUser = session?.user?.name || "";

  const [items, setItems] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [teamFilter, setTeamFilter] = useState<string>("All");
  const [priorityFilter, setPriority] = useState<Priority | "All">("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState("");

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setError("Failed to load workflows. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Read filter from URL on initial load
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (!filterParam) return;

    if (filterParam === "priority:high") {
      setPriority("HIGH");
    } else if (filterParam === "stage:DONE") {
      setStatusFilter("Completed");
    } else if (filterParam.startsWith("assigned-to:")) {
      const assigneeName = filterParam.replace("assigned-to:", "");
      setAssigneeFilter(assigneeName);
    }
  }, [searchParams]);

  const updateDueDate = async (id: string, dueDate: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });
      if (res.ok) {
        await fetchWorkflows();
        setEditingDateId(null);
      } else {
        alert("Failed to update due date");
      }
    } catch (error) {
      console.error("Failed to update due date:", error);
      alert("Failed to update due date");
    }
  };

  const getDisplayStatus = (workflow: Workflow): string => {
    if (workflow.progress === 100) {
      return "Completed";
    }
    return workflow.status;
  };

  const getDisplayDueDate = (workflow: Workflow): string => {
    if (workflow.progress === 100 && workflow.completedAt) {
      const date = new Date(workflow.completedAt);
      return `Completed on ${date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }
    return workflow.dueDate;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((w) => {
      const matchSearch =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.team.toLowerCase().includes(q) ||
        w.assignee.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.tags.some((t) => t.toLowerCase().includes(q));

      let matchAssignee = true;
      if (assigneeFilter !== "All") {
        matchAssignee = w.assignee.name === assigneeFilter;
      }

      // For filtering, treat completed workflows as "Completed" status
      const displayStatus = w.progress === 100 ? "Completed" : w.status;

      return (
        matchSearch &&
        (statusFilter === "All" || displayStatus === statusFilter) &&
        (teamFilter === "All" || w.team === teamFilter) &&
        (priorityFilter === "All" || w.priority === priorityFilter) &&
        matchAssignee
      );
    });
  }, [items, search, statusFilter, teamFilter, priorityFilter, assigneeFilter]);

  const total = items.length;
  const inProgress = items.filter(
    (w) => w.status === "In Progress" && w.progress < 100,
  ).length;
  const blocked = items.filter((w) => w.status === "Blocked").length;
  const completed = items.filter((w) => w.progress === 100).length;
  const activeFilters = [
    statusFilter !== "All",
    teamFilter !== "All",
    priorityFilter !== "All",
    assigneeFilter !== "All",
  ].filter(Boolean).length;

  const validate = (): boolean => {
    const errors: Partial<FormState> = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.dueDate.trim()) errors.dueDate = "Due date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const newWorkflow = await res.json();
      setItems((prev) => [newWorkflow, ...prev]);
      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    } catch {
      setFormErrors({ title: "Failed to create workflow. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchWorkflows();
      } else {
        alert("Failed to delete workflow");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete workflow");
    }
  };

  const openDrawer = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setFormErrors({});
  };
  const clearFilters = () => {
    setStatusFilter("All");
    setTeamFilter("All");
    setPriority("All");
    setAssigneeFilter("All");
    setSearch("");
    router.push("/workflows");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchWorkflows} variant="outline">
          Retry
        </Button>
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Workflows</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            All team workflows in one place
          </p>
        </div>
        <Button
          className="bg-[#0f1f3d] hover:bg-[#10b981] text-sm"
          onClick={openDrawer}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">New Workflow</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          {
            icon: Users,
            color: "bg-gray-100",
            iconColor: "text-gray-500",
            label: "Total",
            val: total,
          },
          {
            icon: Clock,
            color: "bg-[#d1fae5]",
            iconColor: "text-[#10b981]",
            label: "In Progress",
            val: inProgress,
          },
          {
            icon: AlertTriangle,
            color: "bg-red-100",
            iconColor: "text-red-500",
            label: "Blocked",
            val: blocked,
          },
          {
            icon: CheckCircle,
            color: "bg-green-100",
            iconColor: "text-green-600",
            label: "Completed",
            val: completed,
          },
        ].map(({ icon: Icon, color, iconColor, label, val }) => (
          <div
            key={label}
            className="bg-white border rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          >
            <div
              className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
              <div className="text-base md:text-lg font-bold leading-none">
                {val}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search…"
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 ${activeFilters > 0 ? "border-[#10b981] text-[#10b981]" : ""}`}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilters > 0 && (
            <span className="ml-1.5 w-4 h-4 bg-[#0f1f3d] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </Button>
        <div className="flex border rounded-lg overflow-hidden shrink-0">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-2 ${view === v ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
            >
              {v === "grid" ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-3 md:p-4 bg-gray-50 rounded-xl border space-y-3">
          {[
            {
              label: "Status",
              opts: ["All", ...STATUSES],
              val: statusFilter,
              set: (v: string) => setStatusFilter(v as Status | "All"),
            },
            {
              label: "Team",
              opts: ["All", ...TEAMS],
              val: teamFilter,
              set: setTeamFilter,
            },
            {
              label: "Priority",
              opts: ["All", ...PRIORITIES],
              val: priorityFilter,
              set: (v: string) => setPriority(v as Priority | "All"),
            },
          ].map(({ label, opts, val, set }) => (
            <div key={label}>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                {label}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {opts.map((o) => (
                  <button
                    key={o}
                    onClick={() => set(o)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${val === o ? "bg-[#0f1f3d] text-white border-[#0f1f3d]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs md:text-sm text-gray-500">
        Showing{" "}
        <span className="font-semibold text-gray-800">{filtered.length}</span>{" "}
        of {total} workflows
        {(search || activeFilters > 0) && (
          <button
            onClick={clearFilters}
            className="ml-2 text-[#10b981] hover:underline text-xs"
          >
            Clear
          </button>
        )}
      </p>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 border rounded-xl bg-gray-50">
          <p className="text-base font-medium">No workflows found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-[#10b981] hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((w) => {
            const displayStatus = getDisplayStatus(w);
            const displayDueDate = getDisplayDueDate(w);
            const isCompleted = w.progress === 100;

            return (
              <Card
                key={w.id}
                onClick={() => router.push(`/workflows/${w.id}`)}
                className={`p-4 hover:shadow-lg transition-all border-l-4 cursor-pointer ${PRIORITY_CFG[w.priority].border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm leading-snug">
                        {w.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(w.id, w.title);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete workflow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {w.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{w.team}</p>
                      <div className="flex items-center gap-1">
                        {editingDateId === w.id ? (
                          <>
                            <Input
                              type="date"
                              value={tempDate}
                              onChange={(e) => setTempDate(e.target.value)}
                              className="w-28 h-6 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDueDate(w.id, tempDate);
                              }}
                              className="text-green-500 text-xs hover:underline"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDateId(null);
                              }}
                              className="text-gray-500 text-xs hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className={`text-xs cursor-pointer hover:text-blue-500 ${
                                isCompleted
                                  ? "text-green-600 font-semibold"
                                  : w.dueDate === "Overdue"
                                    ? "text-red-500 font-semibold"
                                    : "text-gray-500"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCompleted) return;
                                let dateValue = "";
                                if (
                                  w.dueDate &&
                                  w.dueDate !== "Overdue" &&
                                  w.dueDate !== "No due date"
                                ) {
                                  const parts =
                                    w.dueDate.match(/(\d+)\/(\d+)\/(\d+)/);
                                  if (parts) {
                                    dateValue = `${parts[3]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
                                  }
                                }
                                setTempDate(dateValue);
                                setEditingDateId(w.id);
                              }}
                            >
                              {displayDueDate}
                            </span>
                            {!isCompleted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let dateValue = "";
                                  if (
                                    w.dueDate &&
                                    w.dueDate !== "Overdue" &&
                                    w.dueDate !== "No due date"
                                  ) {
                                    const parts =
                                      w.dueDate.match(/(\d+)\/(\d+)\/(\d+)/);
                                    if (parts) {
                                      dateValue = `${parts[3]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
                                    }
                                  }
                                  setTempDate(dateValue);
                                  setEditingDateId(w.id);
                                }}
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                title="Edit due date"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isCompleted
                        ? "bg-green-100 text-green-700"
                        : STATUS_CFG[w.status].bg
                    } ${isCompleted ? "text-green-700" : STATUS_CFG[w.status].text}`}
                  >
                    {displayStatus}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CFG[w.priority].bg} ${PRIORITY_CFG[w.priority].text}`}
                  >
                    {w.priority.charAt(0) + w.priority.slice(1).toLowerCase()}{" "}
                    Priority
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-gray-700">
                      {w.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${progressColor(w.progress)}`}
                      style={{ width: `${w.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {w.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-r ${w.assignee.color} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {w.assignee.initials}
                    </div>
                    <span className="text-xs text-gray-600">
                      {w.assignee.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {w.progress === 100
                      ? "✓ Done"
                      : `${w.tasksLeft} tasks left`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Workflow",
                  "Team",
                  "Status",
                  "Priority",
                  "Progress",
                  "Assignee",
                  "Due",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium text-gray-500 text-xs whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((w) => {
                const displayStatus = getDisplayStatus(w);
                const displayDueDate = getDisplayDueDate(w);
                const isCompleted = w.progress === 100;

                return (
                  <tr
                    key={w.id}
                    onClick={() => router.push(`/workflows/${w.id}`)}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{w.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">
                        {w.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {w.team}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : STATUS_CFG[w.status].bg
                        } ${isCompleted ? "text-green-700" : STATUS_CFG[w.status].text}`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CFG[w.priority].bg} ${PRIORITY_CFG[w.priority].text}`}
                      >
                        {w.priority.charAt(0) +
                          w.priority.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${progressColor(w.progress)}`}
                            style={{ width: `${w.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {w.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-r ${w.assignee.color} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {w.assignee.initials}
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {w.assignee.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-xs whitespace-nowrap ${
                        isCompleted
                          ? "text-green-600 font-semibold"
                          : w.dueDate === "Overdue"
                            ? "text-red-500 font-semibold"
                            : "text-gray-500"
                      }`}
                    >
                      {displayDueDate}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(w.id, w.title);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/20 z-30" onClick={closeDrawer} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold">New Workflow</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in the details below
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Field label="Title *" error={formErrors.title}>
            <Input
              placeholder="e.g. Client Onboarding – Acme Corp"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className={formErrors.title ? "border-red-400" : ""}
            />
          </Field>
          <Field label="Description">
            <textarea
              placeholder="What is this workflow about?"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Team">
              <SelectInput
                value={form.team}
                onChange={(v) => setForm((f) => ({ ...f, team: v }))}
                options={TEAMS}
              />
            </Field>
            <Field label="Assignee">
              <SelectInput
                value={form.assigneeName}
                onChange={(v) => setForm((f) => ({ ...f, assigneeName: v }))}
                options={TEAM_MEMBERS}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <SelectInput
                value={form.priority}
                onChange={(v) =>
                  setForm((f) => ({ ...f, priority: v as Priority }))
                }
                options={PRIORITIES}
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={form.status}
                onChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Status }))
                }
                options={STATUSES}
              />
            </Field>
          </div>
          <Field label="Due Date *" error={formErrors.dueDate}>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, dueDate: e.target.value }))
              }
              className={formErrors.dueDate ? "border-red-400" : ""}
            />
          </Field>
        </div>
        <div className="px-5 py-4 border-t flex gap-3 shrink-0 bg-white">
          <Button
            variant="outline"
            className="flex-1"
            onClick={closeDrawer}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#0f1f3d] hover:bg-[#10b981]"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-1.5" />
            )}
            {saving ? "Creating…" : "Create Workflow"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
