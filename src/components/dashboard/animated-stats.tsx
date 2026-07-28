"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StatsData {
  totalWorkflows: number;
  inProgress: number;
  completed: number;
  blocked: number;
  avgProgress: number;
}

// CountUp animation component
function CountUp({
  end,
  duration = 2,
  suffix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export function AnimatedStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?days=30")
      .then((res) => res.json())
      .then((data) => {
        setStats({
          totalWorkflows: data.summary?.totalWorkflows || 0,
          inProgress: data.summary?.inProgressCount || 0,
          completed: data.summary?.completedTasks || 0,
          blocked: data.summary?.blockedCount || 0,
          avgProgress: data.summary?.avgProgress || 0,
        });
      })
      .catch(() => console.error("Failed to fetch stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
            <div className="h-8 w-8 bg-muted rounded-lg mb-4"></div>
            <div className="h-8 w-16 bg-muted rounded mb-2"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Workflows",
      value: stats.totalWorkflows,
      icon: "📊",
      color: "from-blue-500 to-cyan-500",
      suffix: "",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: "⚡",
      color: "from-yellow-500 to-orange-500",
      suffix: "",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: "✅",
      color: "from-green-500 to-teal-500",
      suffix: "",
    },
    {
      label: "Blocked",
      value: stats.blocked,
      icon: "⚠️",
      color: "from-red-500 to-pink-500",
      suffix: "",
    },
    {
      label: "Avg Progress",
      value: stats.avgProgress,
      icon: "📈",
      color: "from-purple-500 to-indigo-500",
      suffix: "%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.5 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className={`bg-gradient-to-r ${card.color} rounded-xl p-5 text-white shadow-lg cursor-pointer`}
        >
          <div className="flex justify-between items-start">
            <span className="text-3xl">{card.icon}</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">
              <CountUp end={card.value} duration={1.5} suffix={card.suffix} />
            </div>
            <p className="text-sm opacity-90 mt-1">{card.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
