"use client";

import { useEffect, useState } from "react";
import { Check, X, Edit2 } from "lucide-react";

interface Workflow {
  id: string;
  title: string;
  progress: number;
  stage: string;
  assignee?: { name: string };
  priority: string;
}

const TEAM_MEMBERS = [
  "Asanda",
  "Sizwe",
  "Themba",
  "Ridwaan",
  "Matlhodi",
  "Lutendo",
  "Everyone",
];

export function PipelineView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Fetch ALL workflows (no assignee filter)
  useEffect(() => {
    fetch("/api/workflows")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched workflows:", data);
        setWorkflows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching workflows:", err);
        setWorkflows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const startEditing = (workflow: Workflow) => {
    setEditingId(workflow.id);
    setEditingTitle(workflow.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = async (id: string) => {
    if (!editingTitle.trim()) {
      cancelEditing();
      return;
    }

    try {
      console.log("Saving:", { id, title: editingTitle.trim() });

      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        console.log("Update successful:", updated);
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, title: editingTitle.trim() } : w,
          ),
        );
      } else {
        const error = await res.text();
        console.error("Failed to update title:", error);
        alert("Failed to update workflow name. Check console for details.");
      }
    } catch (error) {
      console.error("Error updating title:", error);
      alert("Error updating workflow name");
    } finally {
      cancelEditing();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 animate-pulse"
          >
            <div className="mb-3 h-5 w-3/4 rounded bg-muted"></div>
            <div className="h-2 w-full rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case "DONE":
        return "bg-green-100 text-green-600";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-600";
      case "BLOCKED":
        return "bg-red-100 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case "IN_PROGRESS":
        return "In Progress";
      case "DONE":
        return "Completed";
      default:
        return stage || "To Do";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="divide-y divide-border">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="p-5 transition-colors hover:bg-muted/40"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                {editingId === workflow.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full max-w-md rounded border border-border bg-background px-2 py-1 text-sm font-semibold text-foreground"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle(workflow.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                    />
                    <button
                      onClick={() => saveTitle(workflow.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-foreground">
                      {workflow.title}
                    </h3>
                    <button
                      onClick={() => startEditing(workflow)}
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      title="Edit workflow name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Assigned to {workflow.assignee?.name || "Unassigned"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(workflow.stage)}`}
                  >
                    {getStageText(workflow.stage)}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">
                {workflow.progress}%
              </span>
            </div>
            <div className="w-full rounded-full bg-muted h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${workflow.progress}%` }}
              />
            </div>
          </div>
        ))}
        {workflows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No workflows found.
          </div>
        )}
      </div>
    </div>
  );
}
