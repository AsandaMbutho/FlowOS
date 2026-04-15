"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  TrendingUp,
  Zap,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export function InsightsPanel() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      setInsights(
        data.insights || [
          "🎯 You're on track to complete 85% of your workflows this week!",
          "💡 Tip: Use daily updates to keep your supervisor informed.",
        ],
      );
      setLastUpdated(new Date());
    } catch {
      setInsights([
        "🎯 You're on track to complete 85% of your workflows this week!",
        "💡 Tip: Use daily updates to keep your supervisor informed.",
      ]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInsights();
  }, [fetchInsights]);

  // Initial fetch + auto-refresh every 30 seconds
  useEffect(() => {
    fetchInsights();

    const interval = setInterval(() => {
      fetchInsights();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchInsights]);

  // Helper to pick an icon based on insight content
  const getInsightIcon = (insight: string) => {
    if (insight.includes("track") || insight.includes("complete")) {
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    }
    if (insight.includes("Tip")) {
      return <Zap className="w-4 h-4 text-amber-500" />;
    }
    if (insight.includes("velocity")) {
      return <Users className="w-4 h-4 text-blue-500" />;
    }
    if (insight.includes("overdue") || insight.includes("risk")) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Sparkles className="w-4 h-4 text-teal-500" />;
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    return lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="insights-card animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-teal-200 rounded-full"></div>
          <div className="h-5 w-24 bg-teal-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 bg-teal-100/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="insights-card">
      <div className="insights-title">
        <Sparkles className="w-5 h-5 text-accent" />
        <span className="font-semibold text-foreground">AI Insights</span>
        <span className="text-xs text-muted-foreground ml-2">
          Powered by FlowOS AI
        </span>

        {/* Last updated timestamp */}
        {lastUpdated && (
          <span className="text-xs text-muted-foreground ml-2">
            · Updated {formatLastUpdated()}
          </span>
        )}

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="ml-auto p-1.5 rounded-lg hover:bg-accent/10 transition-all disabled:opacity-50"
          title="Refresh insights now"
        >
          <RefreshCw
            className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="insights-list">
        {insights.map((insight, index) => (
          <div key={index} className="insights-item group">
            <div className="insights-bullet"></div>
            <div className="flex items-start gap-2 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight)}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
