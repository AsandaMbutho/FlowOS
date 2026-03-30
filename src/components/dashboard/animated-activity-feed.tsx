"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  userName: string;
  action: string;
  workflowTitle: string;
  createdAt: string;
}

export function AnimatedActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activities?limit=10");
      const data = await res.json();
      setActivities(data);
      setNewActivityCount(0);
    } catch (error) {
      console.error("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Poll for new activities every 10 seconds
    const interval = setInterval(() => {
      fetch("/api/activities?limit=1")
        .then((res) => res.json())
        .then((newActivity) => {
          if (
            newActivity[0] &&
            (!activities[0] || newActivity[0].id !== activities[0].id)
          ) {
            setNewActivityCount((prev) => prev + 1);
            fetchActivities();
          }
        });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">🔄 Live Activity Feed</h2>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
              Loading...
            </span>
          </div>
        </div>
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-5 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">🔄 Live Activity Feed</h2>
          <div className="flex items-center gap-2">
            {newActivityCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full"
              >
                +{newActivityCount} new
              </motion.span>
            )}
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
      </div>
      <div className="h-96 overflow-y-auto">
        <AnimatePresence>
          {activities.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-4 border-b hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-sm font-bold text-teal-600">
                  {activity.userName?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {activity.userName || "Someone"}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {activity.action}
                    </span>
                    <span className="font-medium ml-2">
                      {activity.workflowTitle}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
