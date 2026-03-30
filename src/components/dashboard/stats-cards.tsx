"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface Stats {
  activeWorkflows: number;
  avgProgress: number;
  overdueCount: number;
  completedTasks: number;
  totalTasks: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?days=30")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          activeWorkflows: data.summary?.totalWorkflows || 0,
          avgProgress: data.summary?.avgProgress || 0,
          overdueCount: data.summary?.overdueCount || 0,
          completedTasks: data.summary?.completedTasks || 0,
          totalTasks: data.summary?.totalTasks || 0,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      icon: TrendingUp,
      value: String(stats.activeWorkflows),
      label: "Total Workflows",
      trend: `${stats.activeWorkflows} in the system`,
      trendUp: true,
      color: "from-[#0f1f3d] to-[#1a3a6b]",
    },
    {
      icon: Clock,
      value: `${stats.avgProgress}%`,
      label: "Avg Progress",
      trend: "across all workflows",
      trendUp: stats.avgProgress >= 50,
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: AlertTriangle,
      value: String(stats.overdueCount),
      label: "Overdue",
      trend:
        stats.overdueCount === 0
          ? "All on track!"
          : `${stats.overdueCount} need attention`,
      trendUp: stats.overdueCount === 0,
      color:
        stats.overdueCount > 0
          ? "from-red-500 to-orange-500"
          : "from-green-500 to-teal-500",
    },
    {
      icon: CheckCircle,
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      label: "Tasks Completed",
      trend: `${Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}% completion rate`,
      trendUp: stats.completedTasks / (stats.totalTasks || 1) >= 0.5,
      color: "from-green-500 to-teal-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center mb-4`}
          >
            <card.icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold">{card.value}</div>
          <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          <div
            className={`text-xs mt-2 font-medium flex items-center gap-1 ${card.trendUp ? "text-green-600" : "text-red-500"}`}
          >
            {card.trendUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {card.trend}
          </div>
        </Card>
      ))}
    </div>
  );
}
