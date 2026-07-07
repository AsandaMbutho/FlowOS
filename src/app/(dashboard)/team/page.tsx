"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Plus,
  Search,
  UserCheck,
  Shield,
  Code,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Away" | "Inactive";
  initials: string;
  color: string;
  badge: string;
  workflowCount: number;
  completedWorkflows: number;
  avgProgress: number;
}

const defaultTeam: TeamMember[] = [
  {
    id: "1",
    name: "Themba",
    email: "themba@mediaonafrica.co.za",
    role: "Supervisor",
    status: "Active",
    initials: "T",
    color: "from-purple-500 to-indigo-600",
    badge: "Supervisor",
    workflowCount: 0,
    completedWorkflows: 0,
    avgProgress: 0,
  },
  {
    id: "2",
    name: "Asanda",
    email: "asanda@mediaonafrica.co.za",
    role: "Developer",
    status: "Active",
    initials: "A",
    color: "from-teal-500 to-emerald-600",
    badge: "Developer",
    workflowCount: 0,
    completedWorkflows: 0,
    avgProgress: 0,
  },
  {
    id: "3",
    name: "Sizwe",
    email: "sizwe@mediaonafrica.co.za",
    role: "Developer",
    status: "Active",
    initials: "S",
    color: "from-blue-500 to-cyan-600",
    badge: "Developer",
    workflowCount: 0,
    completedWorkflows: 0,
    avgProgress: 0,
  },
];

const statusColors: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Away: "bg-amber-100 text-amber-700 border-amber-200",
  Inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

const roleBadgeColors: Record<string, string> = {
  Supervisor:
    "bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-700 border-indigo-200",
  Developer:
    "bg-gradient-to-r from-teal-100 to-emerald-100 text-emerald-700 border-emerald-200",
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(defaultTeam);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/workflows");
        const data = await res.json();

        if (Array.isArray(data)) {
          const updatedTeam = defaultTeam.map((member) => {
            const memberWorkflows = data.filter(
              (w: any) => w.assignee?.name === member.name,
            );
            const completed = memberWorkflows.filter(
              (w: any) => w.progress === 100,
            ).length;
            const avgProgress =
              memberWorkflows.length > 0
                ? Math.round(
                    memberWorkflows.reduce(
                      (acc: number, w: any) => acc + (w.progress || 0),
                      0,
                    ) / memberWorkflows.length,
                  )
                : 0;

            return {
              ...member,
              workflowCount: memberWorkflows.length,
              completedWorkflows: completed,
              avgProgress: avgProgress,
            };
          });
          setTeam(updatedTeam);
        }
      } catch (error) {
        console.error("Failed to fetch workflows:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filtered = team.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()),
  );

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const totalActive = team.filter((m) => m.status === "Active").length;
  const totalSupervisors = team.filter((m) => m.badge === "Supervisor").length;
  const totalDevelopers = team.filter((m) => m.badge === "Developer").length;
  const overallAvg =
    team.filter((m) => m.workflowCount > 0).length > 0
      ? Math.round(
          team.reduce((acc, m) => acc + m.avgProgress, 0) /
            team.filter((m) => m.workflowCount > 0).length,
        )
      : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground text-sm">
            Manage your team members and their workflow progress
          </p>
        </div>
        <Button className="bg-[#0f1f3d] hover:bg-[#10b981] text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Invite Member
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search team..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <Card
            key={member.id}
            className="p-5 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-gray-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}
                >
                  {member.initials}
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {member.name}
                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {member.status}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {member.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <span
                className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1.5 ${roleBadgeColors[member.badge] || "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                {member.badge}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full border font-medium ${statusColors[member.status]}`}
              >
                {member.status}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Workflow Progress
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {member.avgProgress}%
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                <div
                  className={`h-2.5 rounded-full ${getProgressColor(member.avgProgress)} transition-all duration-500`}
                  style={{ width: `${member.avgProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm font-bold text-gray-800">
                    {member.workflowCount}
                  </div>
                  <div className="text-[10px] text-gray-400">Total</div>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded-lg">
                  <div className="text-sm font-bold text-emerald-600">
                    {member.completedWorkflows}
                  </div>
                  <div className="text-[10px] text-gray-400">Done</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-sm font-bold text-amber-600">
                    {member.workflowCount - member.completedWorkflows}
                  </div>
                  <div className="text-[10px] text-gray-400">Remaining</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="card-depth p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{totalActive}</div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </div>
        </div>
        <div className="card-depth p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{totalSupervisors}</div>
            <div className="text-sm text-muted-foreground">Supervisors</div>
          </div>
        </div>
        <div className="card-depth p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{totalDevelopers}</div>
            <div className="text-sm text-muted-foreground">Developers</div>
          </div>
        </div>
        <div className="card-depth p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{overallAvg}%</div>
            <div className="text-sm text-muted-foreground">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}
