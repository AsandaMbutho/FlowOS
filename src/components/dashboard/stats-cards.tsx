"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface Workflow {
  id: string;
  status: string;
  dueDate: string;
  progress: number;
}

export function StatsCards() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    avgProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workflows")
      .then((res) => res.json())
      .then((data: Workflow[]) => {
        const workflows = Array.isArray(data) ? data : [];
        const total = workflows.length;
        const completed = workflows.filter(
          (w) => w.status === "Completed",
        ).length;
        // NOTE: this compares dueDate to the literal string "Overdue",
        // which will not match a real date value. Likely related to the
        // null-dueDate/computed-label issue from the calendar fix — worth
        // revisiting the actual overdue condition (e.g. dueDate in the past
        // AND status !== "Completed") separately from this color fix.
        const overdue = workflows.filter((w) => w.dueDate === "Overdue").length;
        const avgProgress =
          total > 0
            ? Math.round(
                workflows.reduce((acc, w) => acc + w.progress, 0) / total,
              )
            : 0;
        setStats({ total, completed, overdue, avgProgress });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Total Workflows",
      value: stats.total,
      icon: Briefcase,
      bg: "bg-teal-500/10",
      iconColor: "text-teal-400",
      suffix: "",
    },
    {
      title: "Avg Progress",
      value: stats.avgProgress,
      icon: TrendingUp,
      bg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      suffix: "%",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      bg: "bg-red-500/10",
      iconColor: "text-red-400",
      suffix: "",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      bg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      suffix: "",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {card.value}
                {card.suffix}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {card.title}
              </div>
            </div>
            <div
              className={`stat-icon ${card.bg} group-hover:scale-110 transition-transform`}
            >
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
