"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  Circle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Ban,
  Eye,
  Loader2,
  Save,
  Plus,
  ChevronRight,
  Calendar,
  Users,
  Tag,
  Trash2,
  Send,
  MessageSquare,
  AtSign,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Stage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
type Status = "To Do" | "In Progress" | "Review" | "Completed" | "Blocked";

interface TaskAssignee {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee?: TaskAssignee | null;
}

interface CommentMention {
  user: { id: string; name: string };
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string } | null;
  mentions: CommentMention[];
}

interface RawWorkflow {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  stage: Stage;
  team: string | null;
  tags: string;
  dueDate: string | null;
  progress: number;
  assignee: { id: string; name: string; email: string } | null;
  tasks: Task[];
  activities: {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user?: { name: string };
  }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = ["Asanda", "Sizwe", "Themba", "Shravan"];

const ASSIGNEE_COLORS: Record<string, string> = {
  Asanda: "from-purple-500 to-pink-500",
  Sizwe: "from-green-500 to-teal-500",
  Themba: "from-blue-500 to-cyan-500",
  Shravan: "from-orange-500 to-red-500",
  Lisa: "from-yellow-500 to-orange-500",
  Mike: "from-red-500 to-pink-500",
};

const STATUS_FLOW: Status[] = [
  "To Do",
  "In Progress",
  "Review",
  "Completed",
  "Blocked",
];

const STATUS_CFG: Record<
  Status,
  { bg: string; text: string; icon: React.ElementType }
> = {
  "To Do": { bg: "bg-gray-100", text: "text-gray-600", icon: Circle },
  "In Progress": { bg: "bg-[#d1fae5]", text: "text-[#0f1f3d]", icon: Clock },
  Review: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Eye },
  Completed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  Blocked: { bg: "bg-red-100", text: "text-red-700", icon: Ban },
};

const PRIORITY_CFG: Record<
  Priority,
  { bg: string; text: string; dot: string }
> = {
  HIGH: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  MEDIUM: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  LOW: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageToStatus(stage: Stage): Status {
  const map: Record<Stage, Status> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    DONE: "Completed",
    BLOCKED: "Blocked",
  };
  return map[stage];
}

function statusToStage(status: Status): Stage {
  const map: Record<Status, Stage> = {
    "To Do": "TODO",
    "In Progress": "IN_PROGRESS",
    Review: "REVIEW",
    Completed: "DONE",
    Blocked: "BLOCKED",
  };
  return map[status];
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return date.toLocaleDateString("en-ZA", { weekday: "long" });
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

function safeParseJson(val: string | null): string[] {
  try {
    return JSON.parse(val ?? "[]");
  } catch {
    return [];
  }
}

const progressColor = (p: number) =>
  p === 100
    ? "bg-green-500"
    : p >= 70
      ? "bg-[#10b981]"
      : p >= 40
        ? "bg-yellow-500"
        : "bg-red-400";

// Render comment body with highlighted @mentions
function renderBody(body: string) {
  const parts = body.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-[#10b981] font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [raw, setRaw] = useState<RawWorkflow | null>(null);
  const [status, setStatus] = useState<Status>("To Do");
  const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Comment state
  const [commentBody, setCommentBody] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Task assignee dropdown
  const [assigneeDropdown, setAssigneeDropdown] = useState<string | null>(null);

  // Daily update modal
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyText, setDailyText] = useState("");
  const [dailyProgress, setDailyProgress] = useState<number | null>(null);
  const [dailySaving, setDailySaving] = useState(false);

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  };

  // ── Fetch workflow ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/workflows/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: RawWorkflow) => {
        setRaw(data);
        setStatus(stageToStatus(data.stage));
        setProgress(data.progress);
        setTasks(data.tasks);
      })
      .catch(() => setError("Workflow not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch comments ────────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${id}/comments`);
      if (!res.ok) return;
      setComments(await res.json());
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Save workflow ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: statusToStage(status), progress }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle task ───────────────────────────────────────────────────────────
  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t,
    );
    setTasks(updatedTasks);
    const completed = updatedTasks.filter((t) => t.completed).length;
    setProgress(
      updatedTasks.length > 0
        ? Math.round((completed / updatedTasks.length) * 100)
        : progress,
    );
    markDirty();
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
    } catch {
      setTasks(tasks);
    }
  };

  // ── Assign task ───────────────────────────────────────────────────────────
  const handleAssignTask = async (
    taskId: string,
    assigneeName: string | null,
  ) => {
    setAssigneeDropdown(null);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assignee: assigneeName ? { id: "", name: assigneeName } : null,
            }
          : t,
      ),
    );
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeName }),
      });
    } catch {
      /* silently fail */
    }
  };

  // ── Add task ──────────────────────────────────────────────────────────────
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.trim(), workflowId: id }),
      });
      if (!res.ok) throw new Error();
      const addedTask = await res.json();
      setTasks((prev) => [...prev, addedTask]);
      setNewTask("");
    } catch {
      alert("Failed to add task");
    } finally {
      setAddingTask(false);
    }
  };

  // ── Comment input with @mention ───────────────────────────────────────────
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentBody(val);

    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const mentionSuggestions =
    mentionQuery !== null
      ? TEAM_MEMBERS.filter(
          (m) => m.toLowerCase().startsWith(mentionQuery) && m !== "Asanda",
        )
      : [];

  const insertMention = (name: string) => {
    const textarea = commentRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const before = commentBody.slice(0, cursor).replace(/@\w*$/, `@${name} `);
    const after = commentBody.slice(cursor);
    setCommentBody(before + after);
    setMentionQuery(null);
    textarea.focus();
  };

  const handleCommentKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (i) =>
            (i - 1 + mentionSuggestions.length) % mentionSuggestions.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionSuggestions[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handlePostComment();
    }
  };

  // ── Post comment ──────────────────────────────────────────────────────────
  const handlePostComment = async () => {
    if (!commentBody.trim()) return;
    setPostingComment(true);

    // Extract @mentions
    const mentionedNames = [...commentBody.matchAll(/@(\w+)/g)]
      .map((m) => m[1])
      .filter((name) => TEAM_MEMBERS.includes(name));

    try {
      const res = await fetch(`/api/workflows/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentBody,
          authorName: "Asanda",
          mentionedNames,
        }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setCommentBody("");
      setMentionQuery(null);
    } catch {
      alert("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  // ── Delete comment ────────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
  };

  // ── Daily Update ─────────────────────────────────────────────────────────
  const handleDailyUpdate = async () => {
    if (!dailyText.trim()) return;
    setDailySaving(true);
    try {
      // Post comment
      const mentionedNames = [...dailyText.matchAll(/@(\w+)/g)]
        .map((m) => m[1])
        .filter((name) => TEAM_MEMBERS.includes(name));
      const commentRes = await fetch(`/api/workflows/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: dailyText,
          authorName: "Asanda",
          mentionedNames,
        }),
      });
      if (!commentRes.ok) throw new Error();
      const comment = await commentRes.json();
      setComments((prev) => [...prev, comment]);

      // Update progress if changed
      const newProgress = dailyProgress ?? progress;
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: statusToStage(status),
          progress: newProgress,
        }),
      });
      if (!res.ok) throw new Error();
      setProgress(newProgress);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setDailyOpen(false);
      setDailyText("");
      setDailyProgress(null);
    } catch {
      alert("Failed to save daily update.");
    } finally {
      setDailySaving(false);
    }
  };

  // ── States ────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );

  if (error || !raw)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Workflow not found</p>
        <Link href="/workflows">
          <Button variant="outline">← Back to Workflows</Button>
        </Link>
      </div>
    );

  const tags = safeParseJson(raw.tags);
  const dueDate = formatDueDate(raw.dueDate);
  const assigneeName = raw.assignee?.name ?? "Unassigned";
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/workflows">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" /> Workflows
            </Button>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-sm font-medium text-gray-700 truncate max-w-[300px]">
            {raw.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Unsaved changes
            </span>
          )}
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => setDailyOpen(true)}
          >
            <Zap className="w-4 h-4" /> Daily Update
          </Button>
          <Button
            size="sm"
            className="bg-[#0f1f3d] hover:bg-[#10b981] gap-1.5"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Title + meta */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{raw.title}</h1>
              {raw.description && (
                <p className="text-gray-500 mt-1 text-sm">{raw.description}</p>
              )}
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 ${PRIORITY_CFG[raw.priority].bg} ${PRIORITY_CFG[raw.priority].text}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${PRIORITY_CFG[raw.priority].dot}`}
              />
              {raw.priority} PRIORITY
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-2 border-t border-gray-50">
            {raw.team && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{raw.team}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full bg-gradient-to-r ${ASSIGNEE_COLORS[assigneeName] ?? "from-gray-400 to-gray-500"} flex items-center justify-center text-white text-xs font-bold`}
              >
                {assigneeName.charAt(0)}
              </div>
              <span>{assigneeName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span
                className={
                  dueDate === "Overdue" ? "text-red-500 font-semibold" : ""
                }
              >
                {dueDate}
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <div className="flex gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => {
              const cfg = STATUS_CFG[s];
              const Icon = cfg.icon;
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    markDirty();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.text} border-current shadow-sm scale-105`
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s}
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Progress</h2>
            <span className="text-2xl font-bold text-gray-900">
              {progress}%
            </span>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${progressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => {
                setProgress(Number(e.target.value));
                markDirty();
              }}
              className="w-full accent-[#10b981] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {completedTasks} of {totalTasks} completed
              </p>
            </div>
            {totalTasks > 0 && (
              <span className="text-xs font-medium text-gray-500">
                {Math.round((completedTasks / totalTasks) * 100)}%
              </span>
            )}
          </div>
          <div className="space-y-2 mb-4">
            {tasks.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No tasks yet — add one below
              </p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.completed ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}
              >
                {/* Checkbox */}
                <div
                  onClick={() => handleToggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
                >
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </div>
                {/* Title */}
                <span
                  className={`text-sm flex-1 ${task.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                >
                  {task.title}
                </span>
                {/* Assignee */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setAssigneeDropdown(
                        assigneeDropdown === task.id ? null : task.id,
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {task.assignee ? (
                      <>
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-r ${ASSIGNEE_COLORS[task.assignee.name] ?? "from-gray-400 to-gray-500"} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {task.assignee.name.charAt(0)}
                        </div>
                        <span>{task.assignee.name}</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" /> Assign
                      </>
                    )}
                  </button>
                  {assigneeDropdown === task.id && (
                    <div className="absolute right-0 top-7 bg-white border rounded-xl shadow-lg z-20 py-1 min-w-[140px]">
                      <button
                        onClick={() => handleAssignTask(task.id, null)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50"
                      >
                        Unassign
                      </button>
                      {TEAM_MEMBERS.map((name) => (
                        <button
                          key={name}
                          onClick={() => handleAssignTask(task.id, name)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-r ${ASSIGNEE_COLORS[name]} flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {name.charAt(0)}
                          </div>
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Add task */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddTask}
              disabled={!newTask.trim() || addingTask}
              className="bg-[#0f1f3d] hover:bg-[#10b981]"
            >
              {addingTask ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
            {comments.length > 0 && (
              <span className="text-xs text-gray-400 font-normal">
                ({comments.length})
              </span>
            )}
          </h2>

          {/* Comment list */}
          <div className="space-y-4 mb-6">
            {comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No comments yet — start the conversation
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 group">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${ASSIGNEE_COLORS[c.author?.name ?? ""] ?? "from-gray-400 to-gray-500"} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {c.author?.name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {c.author?.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(c.createdAt)}
                    </span>
                    {c.mentions.length > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-[#10b981]">
                        <AtSign className="w-3 h-3" />
                        {c.mentions.map((m) => m.user.name).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 inline-block max-w-full">
                    {renderBody(c.body)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              A
            </div>
            <div className="flex-1 relative">
              <div className="relative">
                <textarea
                  ref={commentRef}
                  value={commentBody}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Add a comment… type @ to mention someone"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981] pr-10"
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentBody.trim() || postingComment}
                  className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-[#0f1f3d] text-white hover:bg-[#10b981] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {postingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {/* @mention suggestions */}
              {mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
                  <p className="text-xs text-gray-400 px-3 py-1">
                    Mention teammate
                  </p>
                  {mentionSuggestions.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => insertMention(name)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${i === mentionIndex ? "bg-[#f0fdf9] text-[#0f1f3d]" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${ASSIGNEE_COLORS[name]} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {name.charAt(0)}
                      </div>
                      {name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                ⌘/Ctrl + Enter to send
              </p>
            </div>
          </div>
        </div>

        {/* Activity log */}
        {raw.activities.length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Activity Log
            </h2>
            <div className="space-y-3">
              {raw.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">
                      {a.user?.name && (
                        <span className="font-medium">{a.user.name} — </span>
                      )}
                      {a.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Close assignee dropdown on outside click */}
      {assigneeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setAssigneeDropdown(null)}
        />
      )}

      {/* Daily Update Modal */}
      {dailyOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => !dailySaving && setDailyOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-6 w-[90vw] max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Daily Update</h3>
                  <p className="text-xs text-gray-400">Log today's progress</p>
                </div>
              </div>
              <button
                onClick={() => setDailyOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* What did you do today */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                What did you work on today? *
              </label>
              <textarea
                value={dailyText}
                onChange={(e) => setDailyText(e.target.value)}
                placeholder={
                  "e.g. Completed the login flow, fixed the dashboard bug, started working on settings page. Type @Themba to notify your supervisor."
                }
                rows={4}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tip: type @Themba to notify your supervisor automatically
              </p>
            </div>

            {/* Progress update */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">
                  Update progress
                </label>
                <span className="text-sm font-bold text-gray-800">
                  {dailyProgress ?? progress}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={dailyProgress ?? progress}
                onChange={(e) => setDailyProgress(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDailyOpen(false)}
                disabled={dailySaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
                onClick={handleDailyUpdate}
                disabled={!dailyText.trim() || dailySaving}
              >
                {dailySaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {dailySaving ? "Saving…" : "Post Update"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
