"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  ArrowRight,
  GitPullRequest,
  UserCheck,
  CheckSquare,
  Clock,
  AtSign,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | "STATUS_CHANGE"
  | "ASSIGNED"
  | "TASK_COMPLETED"
  | "OVERDUE"
  | "MENTION";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  workflowId: string | null;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<
  NotifType,
  {
    icon: React.ElementType;
    bg: string;
    iconColor: string;
    label: string;
  }
> = {
  STATUS_CHANGE: {
    icon: GitPullRequest,
    bg: "bg-[#d1fae5]",
    iconColor: "text-[#10b981]",
    label: "Status Change",
  },
  ASSIGNED: {
    icon: UserCheck,
    bg: "bg-purple-100",
    iconColor: "text-purple-600",
    label: "Assignment",
  },
  TASK_COMPLETED: {
    icon: CheckSquare,
    bg: "bg-green-100",
    iconColor: "text-green-600",
    label: "Task Completed",
  },
  OVERDUE: {
    icon: Clock,
    bg: "bg-red-100",
    iconColor: "text-red-600",
    label: "Overdue",
  },
  MENTION: {
    icon: AtSign,
    bg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    label: "Mention",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [clearing, setClearing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      setNotifications(await res.json());
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "PATCH" });
  };

  const handleClearAll = async () => {
    setClearing(true);
    await fetch("/api/notifications", { method: "DELETE" });
    setNotifications([]);
    setClearing(false);
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
  };

  const displayed =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group by date
  const grouped = displayed.reduce<Record<string, Notification[]>>((acc, n) => {
    const date = new Date(n.createdAt);
    const now = new Date();
    let label: string;
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else if (diffDays < 7) label = "This Week";
    else label = "Older";
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  const groupOrder = ["Today", "Yesterday", "This Week", "Older"];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-[#0f1f3d] text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="text-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={clearing}
              className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300"
            >
              {clearing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#d1fae5] text-[#0f1f3d] text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div className="text-center py-20 border rounded-2xl bg-gray-50">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "unread"
              ? "You've read everything — nice work!"
              : "Notifications will appear here when workflows change"}
          </p>
          {filter === "unread" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-3 text-sm text-[#10b981] hover:underline"
            >
              View all notifications
            </button>
          )}
        </div>
      )}

      {/* Grouped notifications */}
      {!loading && displayed.length > 0 && (
        <div className="space-y-6">
          {groupOrder
            .filter((g) => grouped[g]?.length > 0)
            .map((group) => (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {group}
                </p>
                <div className="space-y-2">
                  {grouped[group].map((n) => {
                    const cfg = TYPE_CFG[n.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                          n.read
                            ? "bg-white border-gray-100"
                            : "bg-[#f0fdf9]/50 border-blue-100"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p
                                className={`text-sm font-semibold ${n.read ? "text-gray-700" : "text-gray-900"}`}
                              >
                                {n.title}
                                {!n.read && (
                                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#10b981] align-middle" />
                                )}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {n.message}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.iconColor}`}
                            >
                              {cfg.label}
                            </span>
                            {n.workflowId && (
                              <Link
                                href={`/workflows/${n.workflowId}`}
                                className="text-xs text-[#10b981] hover:underline flex items-center gap-1"
                              >
                                View workflow <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            {!n.read && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(n.id)}
                              className={`text-xs text-gray-300 hover:text-red-400 transition-colors ${n.read ? "ml-auto" : ""}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
