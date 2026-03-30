"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Crown, Code, BookOpen, Briefcase } from "lucide-react";

const team = [
  {
    name: "Themba",
    role: "Supervisor",
    department: "Media on Africa",
    email: "themba@mediaonafrica.co.za",
    color: "from-teal-500 to-green-500",
    icon: Crown,
    projects: ["Oversees all projects", "Reviews team progress"],
  },
  {
    name: "Asanda",
    role: "Product Developer",
    department: "Media on Africa",
    email: "asanda@mediaonafrica.co.za",
    color: "from-purple-500 to-pink-500",
    icon: Briefcase,
    projects: [
      "CRM Real Estate Platform",
      "FlowOS — Workflow OS",
      "Stakeholder Feedback",
    ],
  },
  {
    name: "Sizwe",
    role: "Cybersecurity Developer",
    department: "Media on Africa",
    email: "sizwe@mediaonafrica.co.za",
    color: "from-blue-500 to-cyan-500",
    icon: Code,
    projects: [
      "CyberSafe Africa — Core",
      "CyberSafe Africa — Frontend",
      "CyberSafe Africa — Backend & API",
    ],
  },
  {
    name: "Shravan",
    role: "E-Learning Developer",
    department: "Media on Africa",
    email: "shravan@mediaonafrica.co.za",
    color: "from-orange-500 to-red-500",
    icon: BookOpen,
    projects: [
      "E-Learning Platform — Content & Curriculum",
      "E-Learning Platform — Rubric Block Integration",
    ],
  },
];

export default function TeamsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Media on Africa — {new Date().getFullYear()}
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Team Members", val: 4 },
          { label: "Active Projects", val: 8 },
          { label: "Completed", val: 2 },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="bg-white border rounded-xl px-4 py-3 text-center"
          >
            <p className="text-2xl font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {team.map((member) => (
          <Card
            key={member.name}
            className="p-5 hover:shadow-lg transition-shadow"
          >
            {/* Avatar */}
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${member.color} flex items-center justify-center text-white font-bold text-xl mb-4`}
            >
              {member.name[0]}
            </div>

            {/* Info */}
            <h3 className="font-bold text-base">{member.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{member.role}</p>
            <p className="text-xs text-gray-400">{member.department}</p>

            {/* Projects */}
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Projects
              </p>
              {member.projects.map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  <span className="text-xs text-gray-600 leading-snug">
                    {p}
                  </span>
                </div>
              ))}
            </div>

            {/* Email */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-gray-400 truncate">
                {member.email}
              </span>
              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                <Mail className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
