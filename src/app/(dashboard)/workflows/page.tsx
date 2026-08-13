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
  Bookmark,
  Eye,
  File,
  FileText,
  Image,
  Download,
  Video,
  Music,
  FileArchive,
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

interface FileData {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
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
  files?: FileData[];
}

const STATUS_CFG: Record<Status, { bg: string; text: string }> = {
  "In Progress": {
    bg: "bg-[#d1fae5] dark:bg-emerald-500/20",
    text: "text-[#0f1f3d] dark:text-emerald-300",
  },
  Review: {
    bg: "bg-yellow-100 dark:bg-amber-500/20",
    text: "text-yellow-700 dark:text-amber-300",
  },
  Blocked: {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
  },
  Completed: {
    bg: "bg-green-100 dark:bg-green-500/20",
    text: "text-green-700 dark:text-green-300",
  },
  "To Do": {
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
};

const PRIORITY_CFG: Record<
  Priority,
  { bg: string; text: string; border: string }
> = {
  HIGH: {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-l-red-500",
  },
  MEDIUM: {
    bg: "bg-yellow-100 dark:bg-amber-500/20",
    text: "text-yellow-700 dark:text-amber-300",
    border: "border-l-yellow-500",
  },
  LOW: {
    bg: "bg-green-100 dark:bg-green-500/20",
    text: "text-green-700 dark:text-green-300",
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

const TEAM_MEMBERS = [
  "Asanda",
  "Sizwe",
  "Themba",
  "Ridwaan",
  "Matlhodi",
  "Lutendo",
  "Everyone",
];
const TEAMS: string[] = ["Engineering", "Design", "Sales", "Operations"];
const STATUSES: Status[] = [
  "In Progress",
  "Review",
  "Blocked",
  "Completed",
  "To Do",
];
const PRIORITIES: Priority[] = ["HIGH", "MEDIUM", "LOW"];

const SEARCH_FIELDS = [
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "team", label: "Team" },
  { value: "assignee", label: "Assignee" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "tags", label: "Tags" },
  { value: "progress", label: "Progress" },
  { value: "dueDate", label: "Due Date" },
];

const OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts With" },
  { value: "endsWith", label: "Ends With" },
  { value: "gt", label: "Greater Than" },
  { value: "lt", label: "Less Than" },
];

interface FormState {
  title: string;
  description: string;
  team: string;
  assigneeName: string;
  priority: Priority;
  dueDate: string;
  status: Status;
}

interface SearchFilter {
  field: string;
  operator: string;
  value: string;
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
      <label className="block text-xs font-medium text-foreground/80 mb-1">
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
      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#10b981]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ─── Advanced Search Modal ────────────────────────────────────────────────────

function AdvancedSearchModal({
  isOpen,
  onClose,
  onSearch,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, filters: SearchFilter[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([
    { field: "title", operator: "contains", value: "" },
  ]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flowos-saved-searches");
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: "title", operator: "contains", value: "" },
    ]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [field]: value };
    setFilters(updated);
  };

  const handleSearch = () => {
    const validFilters = filters.filter((f) => f.value.trim());
    onSearch(query, validFilters);
    onClose();
  };

  const saveSearch = () => {
    const searchString = JSON.stringify({ query, filters });
    const updated = [...savedSearches, searchString];
    setSavedSearches(updated);
    localStorage.setItem("flowos-saved-searches", JSON.stringify(updated));
    setShowSaved(false);
  };

  const loadSavedSearch = (index: number) => {
    try {
      const parsed = JSON.parse(savedSearches[index]);
      setQuery(parsed.query || "");
      setFilters(
        parsed.filters || [{ field: "title", operator: "contains", value: "" }],
      );
      setShowSaved(false);
    } catch {}
  };

  const getFieldLabel = (field: string) => {
    return SEARCH_FIELDS.find((f) => f.value === field)?.label || field;
  };

  const renderValueInput = (filter: SearchFilter, index: number) => {
    const field = filter.field;

    if (field === "status") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="flex-1 min-w-[100px] border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
        >
          <option value="">Select status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      );
    }

    if (field === "priority") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="flex-1 min-w-[100px] border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
        >
          <option value="">Select priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      );
    }

    if (field === "team") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="flex-1 min-w-[100px] border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
        >
          <option value="">Select team</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      );
    }

    if (field === "progress" || field === "dueDate") {
      return (
        <Input
          type={field === "progress" ? "number" : "date"}
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          placeholder={`Enter ${getFieldLabel(field)}`}
          className="flex-1 min-w-[100px] bg-background border-border text-foreground"
        />
      );
    }

    return (
      <Input
        type="text"
        value={filter.value}
        onChange={(e) => updateFilter(index, "value", e.target.value)}
        placeholder={`Enter ${getFieldLabel(field)}`}
        className="flex-1 min-w-[100px] bg-background border-border text-foreground"
      />
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-4 md:inset-8 z-50 flex items-start justify-center pt-10">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#10b981]" />
              <h2 className="text-lg font-bold text-foreground">
                Advanced Search
              </h2>
              <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                {filters.filter((f) => f.value.trim()).length} filters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                title="Saved searches"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Saved searches */}
          {showSaved && savedSearches.length > 0 && (
            <div className="px-6 py-3 border-b border-border bg-muted/10">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Saved Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((search, i) => {
                  try {
                    const parsed = JSON.parse(search);
                    const label =
                      parsed.query ||
                      Object.values(parsed.filters || {})
                        .map((f: any) => f.value)
                        .filter(Boolean)
                        .join(", ");
                    return (
                      <button
                        key={i}
                        onClick={() => loadSavedSearch(i)}
                        className="text-xs px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-full text-foreground transition-colors flex items-center gap-1.5"
                      >
                        <Search className="w-3 h-3" />
                        {label.substring(0, 30)}
                      </button>
                    );
                  } catch {
                    return null;
                  }
                })}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all workflows..."
                className="pl-9 bg-background border-border text-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or refine with filters</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {filters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg border border-border/50"
              >
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(index, "field", e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
                >
                  {SEARCH_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(index, "operator", e.target.value)
                  }
                  className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
                >
                  {OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {renderValueInput(filter, index)}

                <button
                  onClick={() => removeFilter(index)}
                  className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={addFilter}
              className="text-sm text-[#10b981] hover:text-[#0d8a6a] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add filter
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between bg-muted/5">
            <div className="flex items-center gap-2">
              <button
                onClick={saveSearch}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                disabled={!query && filters.every((f) => !f.value.trim())}
              >
                <Bookmark className="w-3.5 h-3.5" /> Save Search
              </button>
              <button
                onClick={() => {
                  setQuery("");
                  setFilters([
                    { field: "title", operator: "contains", value: "" },
                  ]);
                }}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSearch}
                className="bg-[#0f1f3d] hover:bg-[#10b981] dark:bg-[#10b981] dark:hover:bg-[#0f1f3d] text-white"
              >
                <Search className="w-4 h-4 mr-1.5" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Document Preview Modal ──────────────────────────────────────────────────

function DocumentPreviewModal({
  file,
  onClose,
  onDelete,
}: {
  file: FileData | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);

  if (!file) return null;

  const isImage = file.mimeType?.startsWith("image/");
  const isPDF = file.mimeType === "application/pdf";
  const isText =
    file.mimeType?.startsWith("text/") ||
    file.mimeType === "application/json" ||
    file.filename?.endsWith(".md") ||
    file.filename?.endsWith(".json");
  const isVideo = file.mimeType?.startsWith("video/");
  const isAudio = file.mimeType?.startsWith("audio/");

  useEffect(() => {
    if (!isText) {
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error("Failed to load content");
        const text = await response.text();
        setContent(text);
      } catch {
        setContent("Failed to load file content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file.url, isText]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="w-12 h-12 text-blue-500" />;
    if (isPDF) return <FileText className="w-12 h-12 text-red-500" />;
    if (isVideo) return <Video className="w-12 h-12 text-purple-500" />;
    if (isAudio) return <Music className="w-12 h-12 text-green-500" />;
    if (file.filename?.endsWith(".zip") || file.filename?.endsWith(".rar")) {
      return <FileArchive className="w-12 h-12 text-yellow-500" />;
    }
    return <File className="w-12 h-12 text-muted-foreground" />;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-4 md:inset-8 z-50 bg-card rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {file.originalName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} · {file.mimeType || "Unknown type"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.originalName}
              className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${file.originalName}"?`)) {
                    onDelete(file.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-background/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={file.url}
                alt={file.originalName}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={`${file.url}#toolbar=1`}
              className="w-full h-full rounded-lg border border-border"
              title={file.originalName}
            />
          ) : isText && content !== null ? (
            <div className="h-full overflow-auto">
              <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap p-4 bg-muted/10 rounded-lg border border-border">
                {content}
              </pre>
            </div>
          ) : isVideo ? (
            <video controls className="w-full h-full rounded-lg" src={file.url}>
              Your browser does not support the video tag.
            </video>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#10b981] to-[#0d8a6a] flex items-center justify-center">
                <Music className="w-12 h-12 text-white" />
              </div>
              <audio controls className="w-full max-w-md" src={file.url}>
                Your browser does not support the audio tag.
              </audio>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              {getFileIcon()}
              <div>
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <a
                  href={file.url}
                  download={file.originalName}
                  className="text-[#10b981] hover:underline text-sm mt-2 inline-block"
                >
                  Download to view
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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

  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilter[]>([]);

  // Document preview state
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

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

  const handleAdvancedSearch = (query: string, filters: SearchFilter[]) => {
    setAdvancedQuery(query);
    setAdvancedFilters(filters);
  };

  const handleFilePreview = (file: FileData) => {
    setPreviewFile(file);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/documents?id=${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh workflows to update file list
        await fetchWorkflows();
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const advancedQ = advancedQuery.toLowerCase().trim();

    return items.filter((w) => {
      // Basic search
      let matchSearch =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.team.toLowerCase().includes(q) ||
        w.assignee.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.tags.some((t) => t.toLowerCase().includes(q));

      // Advanced query search
      let matchAdvanced = true;
      if (advancedQ) {
        matchAdvanced =
          w.title.toLowerCase().includes(advancedQ) ||
          w.description.toLowerCase().includes(advancedQ) ||
          w.team.toLowerCase().includes(advancedQ) ||
          w.assignee.name.toLowerCase().includes(advancedQ) ||
          w.tags.some((t) => t.toLowerCase().includes(advancedQ));
      }

      // Advanced filters
      advancedFilters.forEach((filter) => {
        if (!filter.value.trim()) return;
        const field = filter.field;
        const operator = filter.operator;
        const value = filter.value.toLowerCase().trim();

        switch (field) {
          case "title":
            if (operator === "contains") {
              matchAdvanced =
                matchAdvanced && w.title.toLowerCase().includes(value);
            } else if (operator === "equals") {
              matchAdvanced = matchAdvanced && w.title.toLowerCase() === value;
            } else if (operator === "startsWith") {
              matchAdvanced =
                matchAdvanced && w.title.toLowerCase().startsWith(value);
            } else if (operator === "endsWith") {
              matchAdvanced =
                matchAdvanced && w.title.toLowerCase().endsWith(value);
            }
            break;
          case "description":
            matchAdvanced =
              matchAdvanced && w.description.toLowerCase().includes(value);
            break;
          case "team":
            matchAdvanced = matchAdvanced && w.team.toLowerCase() === value;
            break;
          case "assignee":
            matchAdvanced =
              matchAdvanced && w.assignee.name.toLowerCase() === value;
            break;
          case "status": {
            const displayStatus = w.progress === 100 ? "Completed" : w.status;
            matchAdvanced =
              matchAdvanced && displayStatus.toLowerCase() === value;
            break;
          }
          case "priority":
            matchAdvanced = matchAdvanced && w.priority.toLowerCase() === value;
            break;
          case "tags":
            matchAdvanced =
              matchAdvanced &&
              w.tags.some((t) => t.toLowerCase().includes(value));
            break;
          case "progress": {
            const progress = parseInt(value);
            if (!isNaN(progress)) {
              if (operator === "gt") {
                matchAdvanced = matchAdvanced && w.progress > progress;
              } else if (operator === "lt") {
                matchAdvanced = matchAdvanced && w.progress < progress;
              } else {
                matchAdvanced = matchAdvanced && w.progress === progress;
              }
            }
            break;
          }
          case "dueDate":
            // Simple date filtering - can be enhanced
            if (value && w.dueDate) {
              matchAdvanced = matchAdvanced && w.dueDate.includes(value);
            }
            break;
        }
      });

      const matchAssignee =
        assigneeFilter === "All" || w.assignee.name === assigneeFilter;
      const displayStatus = w.progress === 100 ? "Completed" : w.status;
      const matchStatus =
        statusFilter === "All" || displayStatus === statusFilter;
      const matchTeam = teamFilter === "All" || w.team === teamFilter;
      const matchPriority =
        priorityFilter === "All" || w.priority === priorityFilter;

      return (
        matchSearch &&
        matchAdvanced &&
        matchAssignee &&
        matchStatus &&
        matchTeam &&
        matchPriority
      );
    });
  }, [
    items,
    search,
    advancedQuery,
    advancedFilters,
    statusFilter,
    teamFilter,
    priorityFilter,
    assigneeFilter,
  ]);

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
    advancedQuery !== "",
    advancedFilters.some((f) => f.value.trim() !== ""),
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
      const payload = {
        ...form,
        assigneeName: form.assigneeName === "Everyone" ? "" : form.assigneeName,
      };
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    setAdvancedQuery("");
    setAdvancedFilters([]);
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
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Workflows
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            All team workflows in one place
          </p>
        </div>
        <Button
          className="bg-[#0f1f3d] hover:bg-[#10b981] dark:bg-[#10b981] dark:hover:bg-[#0f1f3d] text-sm text-white"
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
            color: "bg-muted",
            iconColor: "text-muted-foreground",
            label: "Total",
            val: total,
          },
          {
            icon: Clock,
            color: "bg-[#d1fae5] dark:bg-emerald-500/20",
            iconColor: "text-[#10b981] dark:text-emerald-400",
            label: "In Progress",
            val: inProgress,
          },
          {
            icon: AlertTriangle,
            color: "bg-red-100 dark:bg-red-500/20",
            iconColor: "text-red-500 dark:text-red-400",
            label: "Blocked",
            val: blocked,
          },
          {
            icon: CheckCircle,
            color: "bg-green-100 dark:bg-green-500/20",
            iconColor: "text-green-600 dark:text-green-400",
            label: "Completed",
            val: completed,
          },
        ].map(({ icon: Icon, color, iconColor, label, val }) => (
          <div
            key={label}
            className="bg-card border-border rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          >
            <div
              className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
              <div className="text-base md:text-lg font-bold leading-none text-foreground">
                {val}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows, documents, and more..."
            className="pl-9 text-sm bg-background border-border text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowAdvancedSearch(true)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedSearch(true)}
          className="shrink-0"
        >
          <Search className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Advanced</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 ${activeFilters > 0 ? "border-[#10b981] text-[#10b981]" : ""}`}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilters > 0 && (
            <span className="ml-1.5 w-4 h-4 bg-[#0f1f3d] dark:bg-[#10b981] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </Button>
        <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-2 ${view === v ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
        <div className="p-3 md:p-4 bg-muted/30 rounded-xl border-border border space-y-3">
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
            {
              label: "Assignee",
              opts: ["All", ...TEAM_MEMBERS],
              val: assigneeFilter,
              set: setAssigneeFilter,
            },
          ].map(({ label, opts, val, set }) => (
            <div key={label}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {label}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {opts.map((o) => (
                  <button
                    key={o}
                    onClick={() => set(o)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      val === o
                        ? "bg-[#0f1f3d] dark:bg-[#10b981] text-white border-[#0f1f3d] dark:border-[#10b981]"
                        : "bg-card text-foreground/60 border-border hover:border-border/80"
                    }`}
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
      <p className="text-xs md:text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
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
        <div className="text-center py-16 text-muted-foreground border-border rounded-xl bg-muted/30">
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
                      <h3 className="font-semibold text-sm leading-snug text-foreground">
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
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {w.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{w.team}</p>
                      <div className="flex items-center gap-1">
                        {editingDateId === w.id ? (
                          <>
                            <Input
                              type="date"
                              value={tempDate}
                              onChange={(e) => setTempDate(e.target.value)}
                              className="w-28 h-6 text-xs bg-background border-border"
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
                              className="text-muted-foreground text-xs hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className={`text-xs cursor-pointer hover:text-blue-500 ${
                                isCompleted
                                  ? "text-green-600 dark:text-green-400 font-semibold"
                                  : w.dueDate === "Overdue"
                                    ? "text-red-500 dark:text-red-400 font-semibold"
                                    : "text-muted-foreground"
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
                                className="text-muted-foreground hover:text-blue-500 transition-colors"
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
                        ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                        : STATUS_CFG[w.status].bg
                    } ${isCompleted ? "text-green-700 dark:text-green-300" : STATUS_CFG[w.status].text}`}
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
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-foreground">
                      {w.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-1.5">
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
                      className="text-xs px-1.5 py-0.5 bg-muted/50 text-muted-foreground rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-r ${w.assignee.color} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {w.assignee.initials}
                    </div>
                    <span className="text-xs text-foreground/80">
                      {w.assignee.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {w.progress === 100
                      ? "✓ Done"
                      : `${w.tasksLeft} tasks left`}
                  </span>
                </div>
                {/* File preview indicator */}
                {w.files && w.files.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <File className="w-3 h-3" />
                    <span>
                      {w.files.length} file{w.files.length > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (w.files && w.files.length > 0) {
                          handleFilePreview(w.files[0]);
                        }
                      }}
                      className="text-[#10b981] hover:underline ml-1"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/30 border-border border-b">
              <tr>
                {[
                  "Workflow",
                  "Team",
                  "Status",
                  "Priority",
                  "Progress",
                  "Assignee",
                  "Due",
                  "Files",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((w) => {
                const displayStatus = getDisplayStatus(w);
                const displayDueDate = getDisplayDueDate(w);
                const isCompleted = w.progress === 100;

                return (
                  <tr
                    key={w.id}
                    onClick={() => router.push(`/workflows/${w.id}`)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground">
                        {w.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">
                        {w.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {w.team}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          isCompleted
                            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                            : STATUS_CFG[w.status].bg
                        } ${isCompleted ? "text-green-700 dark:text-green-300" : STATUS_CFG[w.status].text}`}
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
                        <div className="w-16 bg-muted/30 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${progressColor(w.progress)}`}
                            style={{ width: `${w.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
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
                        <span className="text-xs text-foreground/80 whitespace-nowrap">
                          {w.assignee.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-xs whitespace-nowrap ${
                        isCompleted
                          ? "text-green-600 dark:text-green-400 font-semibold"
                          : w.dueDate === "Overdue"
                            ? "text-red-500 dark:text-red-400 font-semibold"
                            : "text-muted-foreground"
                      }`}
                    >
                      {displayDueDate}
                    </td>
                    <td className="px-4 py-3">
                      {w.files && w.files.length > 0 && (
                        <div className="flex items-center gap-1">
                          <File className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {w.files.length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (w.files && w.files.length > 0) {
                                handleFilePreview(w.files[0]);
                              }
                            }}
                            className="text-[#10b981] hover:underline"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      )}
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
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-card shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">New Workflow</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details below
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-muted/30"
          >
            <X className="w-5 h-5 text-muted-foreground" />
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
              className={
                formErrors.title
                  ? "border-red-400"
                  : "bg-background border-border text-foreground"
              }
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
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-background text-foreground"
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
              className={
                formErrors.dueDate
                  ? "border-red-400"
                  : "bg-background border-border text-foreground"
              }
            />
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0 bg-card">
          <Button
            variant="outline"
            className="flex-1"
            onClick={closeDrawer}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#0f1f3d] hover:bg-[#10b981] dark:bg-[#10b981] dark:hover:bg-[#0f1f3d] text-white"
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

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDelete={handleDeleteFile}
      />
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
