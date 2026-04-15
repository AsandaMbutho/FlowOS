"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  MessageSquare,
  Edit3,
  AlertCircle,
  Clock,
} from "lucide-react";

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
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Same day - show time
    if (diffDays === 0) {
      if (diffMins < 1) return "Just now";
      if (diffMins < 60)
        return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }

    // Yesterday
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Within a week
    if (diffDays < 7) {
      return `${diffDays} days ago at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Older - show full date
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Just now";
  }
}

// Get icon based on action type
function getActivityIcon(action: string) {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("complete") || actionLower.includes("finish")) {
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  }
  if (actionLower.includes("comment")) {
    return <MessageSquare className="w-4 h-4 text-teal-500" />;
  }
  if (actionLower.includes("update") || actionLower.includes("progress")) {
    return <Edit3 className="w-4 h-4 text-blue-500" />;
  }
  if (actionLower.includes("overdue") || actionLower.includes("block")) {
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  }
  return <Users className="w-4 h-4 text-teal-600" />;
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
      <div className="card-depth p-0 overflow-hidden">
        <div className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-depth p-0 overflow-hidden">
      <div className="divide-y divide-border max-h-96 overflow-y-auto custom-scrollbar">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground/90">
                  <span className="font-semibold text-foreground">
                    {activity.userName}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {activity.action}
                  </span>
                  <span className="font-medium text-accent ml-2">
                    {activity.workflowTitle}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(activity.createdAt)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="empty-state py-8">
            <div className="empty-icon text-3xl mb-2">📭</div>
            <p className="empty-title">No recent activity</p>
            <p className="empty-description">Team activity will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
