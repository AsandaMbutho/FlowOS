"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
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

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { data: session } = useSession();
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

  const userName = session?.user?.name || "Team Member";
  const userRole = session?.user?.role;
  const isSupervisor = userRole === "MANAGER" || userRole === "ADMIN";

  useEffect(() => {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((workflows: any[]) => {
        if (!Array.isArray(workflows)) return;
        setCounts({
          total: workflows.length,
          myTasks: workflows.filter(
            (w) => w.assignee?.name === userName && w.status !== "Completed",
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
  }, [userName]);

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
    ...(isSupervisor
      ? [
          {
            name: "Supervisor",
            href: "/dashboard/supervisor",
            icon: Users,
            count: null,
          },
        ]
      : []),
    { name: "Teams", href: "/teams", icon: Users, count: null },
    { name: "Settings", href: "/settings", icon: Settings, count: null },
  ];

  const filters = [
    {
      name: "My Tasks",
      icon: Clock,
      count: counts.myTasks,
      color: "text-white/60",
      filter: `assigned-to:${userName}`,
    },
    {
      name: "High Priority",
      icon: AlertCircle,
      count: counts.highPriority,
      color: "text-red-400",
      filter: "priority:high",
    },
    {
      name: "Completed",
      icon: CheckCircle2,
      count: counts.completed,
      color: "text-[#00C48C]",
      filter: "stage:DONE",
    },
  ];

  const teams = [{ name: "Media on Africa", count: counts.total }];

  const handleFilterClick = (filter: string) => {
    router.push(`/workflows?filter=${filter}`);
    setOpen(false);
  };

  const userInitial = userName?.charAt(0).toUpperCase() || "T";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#0A1628]/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          "bg-[#0D1B4B]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-5 border-b border-white/8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00C48C] text-white font-extrabold text-base tracking-tight shadow-lg shadow-[#00C48C]/20">
              F
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              FlowOS
            </span>
          </div>

          {/* User card */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5">
              <div className="h-9 w-9 rounded-full bg-[#00C48C] flex items-center justify-center text-white font-bold text-sm ring-2 ring-[#00C48C]/30 shrink-0">
                {userInitial}
              </div>
              <div>
                <p className="font-semibold text-white text-sm leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-white/40 leading-tight">
                  {isSupervisor ? "Supervisor" : "Team Member"}
                </p>
              </div>
              <div className="ml-auto h-2 w-2 rounded-full bg-[#00C48C] ring-2 ring-[#00C48C]/20" />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-5">
              <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Main
              </h4>
              <nav className="space-y-0.5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-[#00C48C]/15 text-[#00C48C]"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[#00C48C]" : "text-white/35",
                        )}
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.count !== null && item.count > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            isActive
                              ? "bg-[#00C48C]/20 text-[#00C48C]"
                              : "bg-white/8 text-white/40",
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

            <div className="mx-2 mb-5 h-px bg-white/6" />

            {/* Quick Filters */}
            <div className="mb-5">
              <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Quick Filters
              </h4>
              <nav className="space-y-0.5">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => handleFilterClick(filter.filter)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-all duration-150"
                  >
                    <filter.icon
                      className={cn("h-4 w-4 shrink-0", filter.color)}
                    />
                    <span className="flex-1 text-left">{filter.name}</span>
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs font-semibold text-white/35">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="mx-2 mb-5 h-px bg-white/6" />

            {/* Team */}
            <div>
              <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Team
              </h4>
              <nav className="space-y-0.5">
                {teams.map((team) => (
                  <button
                    key={team.name}
                    onClick={() => {
                      router.push("/teams");
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-all duration-150"
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-50" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00C48C]" />
                    </span>
                    <span className="flex-1 text-left">{team.name}</span>
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs font-semibold text-white/35">
                      {team.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Footer - Logout Button */}
          <div className="border-t border-white/8 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/35 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
