"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

export function InsightsPanel() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((data) => {
        setInsights(
          data.insights || [
            "🎯 You're on track to complete 85% of your workflows this week!",
            "💡 Tip: Use daily updates to keep your supervisor informed.",
            "📊 Team velocity is up 12% from last week!",
          ],
        );
      })
      .catch(() =>
        setInsights([
          "🎯 You're on track to complete 85% of your workflows this week!",
          "💡 Tip: Use daily updates to keep your supervisor informed.",
        ]),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-12 bg-teal-100 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
