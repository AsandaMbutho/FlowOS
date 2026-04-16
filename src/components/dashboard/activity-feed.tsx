"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  MessageSquare,
  Edit3,
  AlertCircle,
} from "lucide-react";

interface Activity {
  id: string;
  user: string;
  action: string;
  details: string;
  time: string;
  workflowTitle: string;
  userColor: string;
}

function formatDate(dateValue: any): string {
  try {
    if (!dateValue) return "Recently";

    let dateStr = String(dateValue);

    // Remove any spaces
    dateStr = dateStr.replace(/\s/g, "");

    // Replace H with T (fix malformed date)
    dateStr = dateStr.replace("H", "T");

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      if (diffMins < 1) return "Just now";
      if (diffMins < 60)
        return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  } catch {
    return "Recently";
  }
}

function getActivityIcon(action: string) {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("complete")) {
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
      .then((data) => {
        setActivities(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setActivities([]);
        setLoading(false);
      });
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

  if (activities.length === 0) {
    return (
      <div className="card-depth p-5 text-center">
        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
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
                    {activity.user}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {activity.action}
                  </span>
                  <span className="font-medium text-accent ml-2">
                    {activity.workflowTitle}
                  </span>
                </p>
                {activity.details && activity.details !== activity.action && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.details}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(activity.time)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
