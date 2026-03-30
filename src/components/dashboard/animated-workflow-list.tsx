"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";

interface Workflow {
  id: string;
  title: string;
  progress: number;
  stage: string;
  assignee?: { name: string };
  priority: string;
}

export function AnimatedWorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workflows")
      .then((res) => res.json())
      .then((data) => {
        setWorkflows(Array.isArray(data) ? data : []);
      })
      .catch(() => console.error("Failed to fetch workflows"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
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

  const getPriorityColor = (priority: string) => {
    return priority === "HIGH"
      ? "bg-red-100 text-red-600"
      : "bg-yellow-100 text-yellow-600";
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-5 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">📋 Active Workflows</h2>
        <p className="text-sm text-gray-500">
          Progress updates with smooth animations
        </p>
      </div>
      <div className="divide-y">
        <AnimatePresence>
          {workflows.map((workflow, idx) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileHover={{ backgroundColor: "#f9fafb", x: 4 }}
              className="p-5 transition-all"
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
                      className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(workflow.priority)}`}
                    >
                      {workflow.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(workflow.stage)}`}
                    >
                      {getStageText(workflow.stage)}
                    </span>
                  </div>
                </div>
                <motion.span
                  key={workflow.progress}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-bold"
                >
                  {workflow.progress}%
                </motion.span>
              </div>
              <AnimatedProgressBar
                progress={workflow.progress}
                height="md"
                showLabel={false}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
