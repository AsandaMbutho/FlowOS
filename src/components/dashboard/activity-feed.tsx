"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface Activity {
  id: string;
  userName: string;
  action: string;
  workflowTitle: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Just now";

    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Just now";
  }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activities?limit=10")
      .then((res) => res.json())
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
        <div className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
      <div className="divide-y max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.userName}</span>
                  <span className="text-gray-600 ml-2">{activity.action}</span>
                  <span className="font-medium ml-2">
                    {activity.workflowTitle}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(activity.createdAt)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No recent team activity.
          </div>
        )}
      </div>
    </div>
  );
}
