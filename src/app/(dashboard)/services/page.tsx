"use client";

import Link from "next/link";
import {
  Code2,
  ShieldCheck,
  LineChart,
  Smartphone,
  Lightbulb,
  Briefcase,
  ArrowRight,
  Cpu,
  Database,
  Cloud,
  Users,
  Rocket,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const services = [
  {
    id: "web-development",
    title: "Web Development",
    description:
      "Custom websites and web applications built with modern technologies.",
    icon: Code2,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    href: "/services/web-development",
  },
  {
    id: "security-compliance",
    title: "Data Security & Compliance",
    description:
      "Enterprise-grade security solutions ensuring your data and systems.",
    icon: ShieldCheck,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    href: "/services/security-compliance",
  },
  {
    id: "analytics-insights",
    title: "Analytics & Insights",
    description:
      "Data-driven solutions to understand your customers and optimize your business.",
    icon: LineChart,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    href: "/services/analytics-insights",
  },
  {
    id: "mobile-solutions",
    title: "Mobile Solutions",
    description:
      "Native and cross-platform mobile applications for any device.",
    icon: Smartphone,
    color: "from-teal-500 to-emerald-500",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    href: "/services/mobile-solutions",
  },
  {
    id: "digital-strategy",
    title: "Digital Strategy",
    description:
      "Comprehensive digital transformation strategies tailored to your market.",
    icon: Rocket,
    color: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    href: "/services/digital-strategy",
  },
  {
    id: "consulting",
    title: "Consulting Services",
    description:
      "Expert guidance on technology decisions, architecture, and transformation initiatives.",
    icon: Briefcase,
    color: "from-slate-500 to-gray-600",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    href: "/services/consulting",
  },
];

export default function ServicesPage() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Services
        </h1>
        <p className="text-muted-foreground">
          Explore our professional services and solutions
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link key={service.id} href={service.href}>
              <Card className="group relative overflow-hidden p-6 hover:shadow-xl transition-all duration-300 border border-border hover:border-[#10b981]/30 cursor-pointer h-full bg-card">
                {/* Gradient accent line at top */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="flex items-start gap-4">
                  {/* Icon Container */}
                  <div
                    className={`w-14 h-14 rounded-xl ${service.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}
                  >
                    <Icon
                      className={`w-7 h-7 text-${service.color.split(" ")[0].replace("from-", "")}`}
                      style={{
                        color: `var(--${service.color.split(" ")[0].replace("from-", "")})`,
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-[#10b981] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Footer with Learn More */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#10b981] group-hover:gap-2 transition-all flex items-center">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-xs text-muted-foreground/50">
                    {service.id === "web-development" && "Web Apps"}
                    {service.id === "security-compliance" && "Security"}
                    {service.id === "analytics-insights" && "Analytics"}
                    {service.id === "mobile-solutions" && "Mobile"}
                    {service.id === "digital-strategy" && "Strategy"}
                    {service.id === "consulting" && "Consulting"}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional Services Section */}
      <div className="mt-12 p-8 rounded-2xl border border-border bg-muted/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Need a custom solution?
            </h2>
            <p className="text-muted-foreground mt-1">
              We tailor our services to meet your specific business needs.
            </p>
          </div>
          <Link href="/contact">
            <button className="px-6 py-2.5 rounded-lg bg-[#0f1f3d] hover:bg-[#10b981] text-white font-medium transition-colors duration-200 whitespace-nowrap">
              Contact Us
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
