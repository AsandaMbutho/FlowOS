"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface Activity {
  id: string;
  user: string;
  action: string;
  details: string;
  time: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activities?limit=10")
      .then((res) => res.json())
      .then((data) => {
        setActivities(Array.isArray(data) ? data : []);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";

    // Format as dd/mm/yy
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    // Time in 12-hour format
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

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
                  <span className="font-medium">
                    {activity.user || "Someone"}
                  </span>
                  <span className="text-gray-600 ml-2">{activity.action}</span>
                  <span className="font-medium ml-2">
                    {activity.details
                      ?.replace("Updated workflow: ", "")
                      .replace("New workflow: ", "")}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(activity.time)}
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
