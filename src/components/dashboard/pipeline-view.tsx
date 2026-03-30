"use client";

import { useEffect, useState } from "react";

interface Workflow {
  id: string;
  title: string;
  progress: number;
  stage: string;
  assignee?: { name: string };
  priority: string;
}

export function PipelineView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workflows?assignee=Asanda")
      .then((res) => res.json())
      .then((data) => {
        setWorkflows(Array.isArray(data) ? data : []);
      })
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse border">
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"></div>
            <div className="h-2 w-full bg-gray-200 rounded"></div>
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
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case "IN_PROGRESS":
        return "In Progress";
      case "DONE":
        return "Completed";
      default:
        return stage;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
      <div className="divide-y">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {workflow.title}
                </h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    👤 {workflow.assignee?.name || "Unassigned"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(workflow.stage)}`}
                  >
                    {getStageText(workflow.stage)}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold">{workflow.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${workflow.progress}%` }}
              />
            </div>
          </div>
        ))}
        {workflows.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No workflows assigned to you.
          </div>
        )}
      </div>
    </div>
  );
}
