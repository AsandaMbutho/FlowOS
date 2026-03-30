import { useState, useEffect } from "react";

interface AIInsights {
  summary: {
    atRisk: number;
    efficiency: number;
    bottlenecks: number;
  };
  detailed: string;
  recommendations: string[];
  predictions: string[];
}

export function useAIInsights(refreshInterval = 300000) {
  // 5 minutes default
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      setInsights(data);
      setError(null);
    } catch (err) {
      setError("AI insights temporarily unavailable");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { insights, loading, error, refresh: fetchInsights };
}

export function useWorkflowPrediction(workflowId: string) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getPrediction = async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });
      const data = await res.json();
      setPrediction(data);
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { prediction, loading, getPrediction };
}
