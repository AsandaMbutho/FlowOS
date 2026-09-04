"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Upload,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

interface FileData {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
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
  completedAt: string | null;
  createdAt: string;
  assignee: { id: string; name: string; email: string } | null;
  tasks: Task[];
  files: FileData[];
  activities: {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user?: { name: string };
  }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  "Asanda",
  "Sizwe",
  "Themba",
  "Ridwaan",
  "Matlhodi",
  "Lutendo",
  "Everyone",
];

const ASSIGNEE_COLORS: Record<string, string> = {
  Asanda: "from-purple-500 to-pink-500",
  Sizwe: "from-green-500 to-teal-500",
  Themba: "from-blue-500 to-cyan-500",
  Everyone: "from-slate-500 to-zinc-500",
  Ridwaan: "from-orange-500 to-red-500",
  Lutendo: "from-indigo-500 to-blue-500",
  Matlhodi: "from-rose-500 to-pink-500",
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
  "To Do": {
    bg: "bg-muted/50 dark:bg-muted/30",
    text: "text-muted-foreground",
    icon: Circle,
  },
  "In Progress": {
    bg: "bg-emerald-100/80 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: Clock,
  },
  Review: {
    bg: "bg-amber-100/80 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    icon: Eye,
  },
  Completed: {
    bg: "bg-green-100/80 dark:bg-green-500/20",
    text: "text-green-700 dark:text-green-300",
    icon: CheckCircle,
  },
  Blocked: {
    bg: "bg-red-100/80 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    icon: Ban,
  },
};

const PRIORITY_CFG: Record<
  Priority,
  { bg: string; text: string; dot: string }
> = {
  HIGH: {
    bg: "bg-red-100/80 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500 dark:bg-red-400",
  },
  MEDIUM: {
    bg: "bg-amber-100/80 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  LOW: {
    bg: "bg-green-100/80 dark:bg-green-500/20",
    text: "text-green-700 dark:text-green-300",
    dot: "bg-green-500 dark:bg-green-400",
  },
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

function getDisplayDate(
  dueDate: string | null,
  completedAt: string | null,
  progress: number,
): string {
  if (progress === 100 && completedAt) {
    const date = new Date(completedAt);
    return `Completed on ${date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  if (!dueDate) return "No due date";
  const date = new Date(dueDate);
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// FIXED: Handle undefined mimeType
function getFileIcon(mimeType: string) {
  if (!mimeType) return <File className="w-4 h-4 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (mimeType === "application/pdf")
    return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

// FIXED: Handle undefined mimeType
function isImage(mimeType: string) {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const currentUser = session?.user?.name || "Unknown";

  const [raw, setRaw] = useState<RawWorkflow | null>(null);
  const [status, setStatus] = useState<Status>("To Do");
  const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProject, setUploadProject] = useState("flowos");

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
        setFiles(data.files || []);
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

  // ── File upload (Uses Vercel Blob) ──────────────────────────────────────
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("project", uploadProject);
    formData.append("workflowId", id);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const newFile = await res.json();
        setFiles((prev) => [...prev, newFile]);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "file-upload",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        alert("Document uploaded successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Max 10MB");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Delete this file?")) return;
    setDeletingFile(fileId);
    try {
      const res = await fetch(`/api/documents?id=${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  const determineProject = (title: string) => {
    if (title.toLowerCase().includes("cybersafe")) return "cybersafe";
    if (title.toLowerCase().includes("elearning")) return "elearning";
    if (title.toLowerCase().includes("crm")) return "crm";
    return "flowos";
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
    const submittedAssigneeName =
      assigneeName === "Everyone" ? null : assigneeName;
    setAssigneeDropdown(null);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assignee: submittedAssigneeName
                ? { id: "", name: submittedAssigneeName }
                : null,
            }
          : t,
      ),
    );
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeName: submittedAssigneeName }),
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
          (m) => m.toLowerCase().startsWith(mentionQuery),
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

    const mentionedNames = [...commentBody.matchAll(/@(\w+)/g)]
      .map((m) => m[1])
      .filter((name) => TEAM_MEMBERS.includes(name));

    try {
      const res = await fetch(`/api/workflows/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentBody,
          authorName: currentUser,
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
      const mentionedNames = [...dailyText.matchAll(/@(\w+)/g)]
        .map((m) => m[1])
        .filter((name) => TEAM_MEMBERS.includes(name));
      const commentRes = await fetch(`/api/workflows/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: dailyText,
          authorName: currentUser,
          mentionedNames,
        }),
      });
      if (!commentRes.ok) throw new Error();
      const comment = await commentRes.json();
      setComments((prev) => [...prev, comment]);

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
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );

  if (error || !raw)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-muted-foreground">Workflow not found</p>
        <Link href="/workflows">
          <Button variant="outline">← Back to Workflows</Button>
        </Link>
      </div>
    );

  const tags = safeParseJson(raw.tags);
  const displayDate = getDisplayDate(
    raw.dueDate,
    raw.completedAt,
    raw.progress,
  );
  const assigneeName = raw.assignee?.name ?? "Unassigned";
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-card border-border border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/workflows">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Workflows
            </Button>
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-foreground/80 truncate max-w-[300px]">
            {raw.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Unsaved changes
            </span>
          )}
          {saved && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            onClick={() => setDailyOpen(true)}
          >
            <Zap className="w-4 h-4" /> Daily Update
          </Button>
          <Button
            size="sm"
            className="bg-[#0f1f3d] text-white hover:bg-[#10b981] hover:text-white gap-1.5"
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
        <div className="bg-card rounded-2xl border-border border p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {raw.title}
              </h1>
              {raw.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {raw.description}
                </p>
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
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t border-border/50">
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
            {raw.createdAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground/70">
                <span>📅</span>
                <span className="text-xs">
                  Created{" "}
                  {new Date(raw.createdAt).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span
                className={
                  displayDate === "Overdue"
                    ? "text-red-500 dark:text-red-400 font-semibold"
                    : displayDate.startsWith("Completed")
                      ? "text-green-600 dark:text-green-400 font-semibold"
                      : ""
                }
              >
                {displayDate}
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <div className="flex gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-muted/50 text-muted-foreground rounded text-xs"
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
        <div className="bg-card rounded-2xl border-border border p-6">
          <h2 className="text-sm font-semibold text-foreground/80 mb-4">
            Status
          </h2>
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
                      : "bg-card text-muted-foreground border-border hover:border-border/80 hover:bg-muted/30"
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
        <div className="bg-card rounded-2xl border-border border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground/80">
              Progress
            </h2>
            <span className="text-2xl font-bold text-foreground">
              {progress}%
            </span>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-muted/30 rounded-full h-3">
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
            <div className="flex justify-between text-xs text-muted-foreground/70">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-card rounded-2xl border-border border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground/80">
                Tasks
              </h2>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {completedTasks} of {totalTasks} completed
              </p>
            </div>
            {totalTasks > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                {Math.round((completedTasks / totalTasks) * 100)}%
              </span>
            )}
          </div>
          <div className="space-y-2 mb-4">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground/70 text-center py-6">
                No tasks yet — add one below
              </p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  task.completed
                    ? "bg-green-100/30 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                    : "bg-muted/30 border-border/50"
                }`}
              >
                <div
                  onClick={() => handleToggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                    task.completed
                      ? "bg-green-500 border-green-500"
                      : "border-border hover:border-green-400"
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </div>
                <span
                  className={`text-sm flex-1 ${
                    task.completed
                      ? "line-through text-muted-foreground/70"
                      : "text-foreground/80"
                  }`}
                >
                  {task.title}
                </span>
                <div className="relative">
                  <button
                    onClick={() =>
                      setAssigneeDropdown(
                        assigneeDropdown === task.id ? null : task.id,
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
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
                    <div className="absolute right-0 top-7 bg-card border-border rounded-xl shadow-lg z-20 py-1 min-w-[140px]">
                      <button
                        onClick={() => handleAssignTask(task.id, null)}
                        className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30"
                      >
                        Unassign
                      </button>
                      {TEAM_MEMBERS.map((name) => (
                        <button
                          key={name}
                          onClick={() => handleAssignTask(task.id, name)}
                          className="w-full text-left px-3 py-2 text-xs text-foreground/80 hover:bg-muted/30 flex items-center gap-2"
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
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1 bg-background text-foreground border-border"
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

        {/* ─── FILES SECTION ─── */}
        <div className="bg-card rounded-2xl border-border border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Documents
              {files.length > 0 && (
                <span className="text-xs text-muted-foreground/70 font-normal">
                  ({files.length})
                </span>
              )}
            </h2>
          </div>

          {/* Upload Area */}
          <div className="mb-4 p-4 border-2 border-dashed border-border rounded-lg">
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileInputChange}
                className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#0f1f3d] file:text-white hover:file:bg-[#10b981] hover:file:text-white"
                disabled={uploading}
              />
              <select
                value={uploadProject}
                onChange={(e) => setUploadProject(e.target.value)}
                className="text-sm border-border rounded-lg px-3 py-1.5 bg-background text-foreground"
              >
                <option value="flowos">FlowOS</option>
                <option value="cybersafe">CyberSafe</option>
                <option value="elearning">E-Learning</option>
                <option value="crm">CRM</option>
              </select>
              <Button
                size="sm"
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className="bg-[#0f1f3d] text-white hover:bg-[#10b981] hover:text-white"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                Selected: {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {files.length === 0 ? (
            <div className="text-sm text-muted-foreground/70 text-center py-6 border-2 border-dashed border-border/50 rounded-lg">
              No documents uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border-border rounded-lg p-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* FIXED: isImage now handles undefined mimeType safely */}
                    {isImage(file.mimeType) ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                        {/* FIXED: getFileIcon now handles undefined mimeType safely */}
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-foreground truncate"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatFileSize(file.size)} ·{" "}
                        {file.mimeType || "Unknown"}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/70 hover:text-blue-500 transition-colors p-1"
                        title="View/Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deletingFile === file.id}
                        className="text-muted-foreground/70 hover:text-red-500 transition-colors p-1"
                        title="Delete"
                      >
                        {deletingFile === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── COMMENTS SECTION ─── */}
        <div className="bg-card rounded-2xl border-border border p-6">
          <h2 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
            {comments.length > 0 && (
              <span className="text-xs text-muted-foreground/70 font-normal">
                ({comments.length})
              </span>
            )}
          </h2>

          <div className="space-y-4 mb-6">
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground/70 text-center py-4">
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
                    <span className="text-sm font-semibold text-foreground">
                      {c.author?.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {timeAgo(c.createdAt)}
                    </span>
                    {c.mentions.length > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-[#10b981]">
                        <AtSign className="w-3 h-3" />
                        {c.mentions.map((m) => m.user.name).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-foreground/80 bg-muted/30 rounded-xl px-4 py-2.5 inline-block max-w-full">
                    {renderBody(c.body)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400 shrink-0 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

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
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981] pr-10 bg-background text-foreground"
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
              {mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 bg-card border-border rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
                  <p className="text-xs text-muted-foreground/70 px-3 py-1">
                    Mention teammate
                  </p>
                  {mentionSuggestions.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => insertMention(name)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        i === mentionIndex
                          ? "bg-[#f0fdf9] dark:bg-emerald-950/30 text-foreground"
                          : "hover:bg-muted/30 text-foreground/80"
                      }`}
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
              <p className="text-xs text-muted-foreground/70 mt-1">
                ⌘/Ctrl + Enter to send
              </p>
            </div>
          </div>
        </div>

        {/* Activity log */}
        {raw.activities.length > 0 && (
          <div className="bg-card rounded-2xl border-border border p-6">
            <h2 className="text-sm font-semibold text-foreground/80 mb-4">
              Activity Log
            </h2>
            <div className="space-y-3">
              {raw.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground/80">
                      {a.user?.name && (
                        <span className="font-medium text-foreground">
                          {a.user.name} —{" "}
                        </span>
                      )}
                      {a.details}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {assigneeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setAssigneeDropdown(null)}
        />
      )}

      {dailyOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => !dailySaving && setDailyOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl shadow-2xl z-50 p-6 w-[90vw] max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Daily Update
                  </h3>
                  <p className="text-xs text-muted-foreground/70">
                    Log today's progress
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDailyOpen(false)}
                className="p-1 rounded-lg hover:bg-muted/30"
              >
                <X className="w-4 h-4 text-muted-foreground/70" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
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
                className="w-full border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-background text-foreground"
              />
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tip: type @Themba to notify your supervisor automatically
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  Update progress
                </label>
                <span className="text-sm font-bold text-foreground">
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
              <div className="flex justify-between text-xs text-muted-foreground/50 mt-0.5">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

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
