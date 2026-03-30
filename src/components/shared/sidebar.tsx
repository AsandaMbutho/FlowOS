"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Workflow,
  BarChart3,
  KanbanSquare,
  Settings,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

// ── Brand colours ──────────────────────────────────────────────────────────
// Primary Navy  : #0D1B4B  — active nav, logo bg, primary text
// Teal Accent   : #00C48C  — badges, dots, hover accents
// Dark Surface  : #0A1628  — overlay backdrop
// Light BG      : #F4F4F5  — section header backgrounds
// Body Text     : #4B5563  — secondary / muted text
// ---------------------------------------------------------------------------

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface Counts {
  total: number;
  myTasks: number;
  highPriority: number;
  completed: number;
  engineering: number;
  design: number;
  sales: number;
  operations: number;
}

const CURRENT_USER = "Asanda";

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    myTasks: 0,
    highPriority: 0,
    completed: 0,
    engineering: 0,
    design: 0,
    sales: 0,
    operations: 0,
  });

  useEffect(() => {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((workflows: any[]) => {
        if (!Array.isArray(workflows)) return;
        setCounts({
          total: workflows.length,
          myTasks: workflows.filter(
            (w) =>
              w.assignee?.name === CURRENT_USER && w.status !== "Completed",
          ).length,
          highPriority: workflows.filter(
            (w) => w.priority === "HIGH" && w.status !== "Completed",
          ).length,
          completed: workflows.filter((w) => w.status === "Completed").length,
          engineering: workflows.filter((w) => w.team === "Engineering").length,
          design: workflows.filter((w) => w.team === "Design").length,
          sales: workflows.filter((w) => w.team === "Sales").length,
          operations: workflows.filter((w) => w.team === "Operations").length,
        });
      })
      .catch(() => {});
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      count: null,
    },
    {
      name: "Workflows",
      href: "/workflows",
      icon: Workflow,
      count: counts.total,
    },
    { name: "Kanban", href: "/kanban", icon: KanbanSquare, count: null },
    { name: "Analytics", href: "/analytics", icon: BarChart3, count: null },
    { name: "Teams", href: "/teams", icon: Users, count: null },
    { name: "Settings", href: "/settings", icon: Settings, count: null },
  ];

  const filters = [
    {
      name: "My Tasks",
      icon: Clock,
      count: counts.myTasks,
      color: "text-[#0D1B4B]", // navy for "my tasks"
      filter: `assigned-to:${CURRENT_USER}`,
    },
    {
      name: "High Priority",
      icon: AlertCircle,
      count: counts.highPriority,
      color: "text-red-500", // keep red — universally understood as urgent
      filter: "priority:high",
    },
    {
      name: "Completed",
      icon: CheckCircle2,
      count: counts.completed,
      color: "text-[#00C48C]", // teal accent for completed/success
      filter: "stage:DONE",
    },
  ];

  const teams = [
    { name: "Media on Africa", count: counts.total, color: "bg-[#00C48C]" },
  ];

  const handleFilterClick = (filter: string) => {
    router.push(`/workflows?filter=${filter}`);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile overlay — dark navy tint instead of pure black */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#0A1628]/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[#0D1B4B]/10 bg-white transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile logo */}
          <div className="flex h-16 items-center gap-2 border-b border-[#0D1B4B]/10 px-4 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B4B] text-white font-bold text-sm">
              F
            </div>
            <span className="font-semibold text-[#0D1B4B]">FlowOS</span>
          </div>

          {/* User info */}
          <div className="border-b border-[#0D1B4B]/10 px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Avatar: navy-to-teal gradient matching the brand */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0D1B4B] to-[#00C48C] flex items-center justify-center text-white font-bold shrink-0">
                A
              </div>
              <div>
                <p className="font-medium text-[#0D1B4B]">Asanda</p>
                <p className="text-xs text-[#4B5563]">Media on Africa</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3">
              {/* Main navigation */}
              <div className="mb-6">
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  MAIN
                </h4>
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#0D1B4B] text-white"
                            : "text-[#0D1B4B] hover:bg-[#00C48C]/10",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-[#00C48C]" : "text-[#4B5563]",
                          )}
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.count !== null && item.count > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              isActive
                                ? "bg-[#00C48C]/20 text-[#00C48C]"
                                : "bg-[#0D1B4B]/10 text-[#0D1B4B]",
                            )}
                          >
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  QUICK FILTERS
                </h4>
                <nav className="space-y-1">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => handleFilterClick(filter.filter)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#0D1B4B] hover:bg-[#00C48C]/10 transition-colors"
                    >
                      <filter.icon className={cn("h-4 w-4", filter.color)} />
                      <span className="flex-1 text-left">{filter.name}</span>
                      <span className="rounded-full bg-[#0D1B4B]/10 px-2 py-0.5 text-xs text-[#0D1B4B] font-medium">
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Teams */}
              <div className="mb-6">
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                  TEAM
                </h4>
                <nav className="space-y-1">
                  {teams.map((team) => (
                    <button
                      key={team.name}
                      onClick={() => {
                        router.push("/teams");
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#0D1B4B] hover:bg-[#00C48C]/10 transition-colors"
                    >
                      {/* Teal dot for the team indicator */}
                      <div className={cn("h-2 w-2 rounded-full", team.color)} />
                      <span className="flex-1 text-left">{team.name}</span>
                      <span className="rounded-full bg-[#0D1B4B]/10 px-2 py-0.5 text-xs text-[#0D1B4B] font-medium">
                        {team.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Footer — log out */}
          <div className="border-t border-[#0D1B4B]/10 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
