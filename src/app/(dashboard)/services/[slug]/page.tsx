"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import {
  Code2,
  ShieldCheck,
  LineChart,
  Smartphone,
  Rocket,
  Briefcase,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const servicesData: Record<
  string,
  {
    title: string;
    description: string;
    icon: LucideIcon;
    details: string[];
    color: string;
  }
> = {
  "web-development": {
    title: "Web Development",
    description:
      "Custom websites and web applications built with modern technologies.",
    icon: Code2,
    color: "from-blue-500 to-cyan-500",
    details: [
      "Custom website design and development",
      "Web application development",
      "Responsive and mobile-first design",
      "E-commerce solutions",
      "Content management systems",
      "API development and integration",
    ],
  },
  "security-compliance": {
    title: "Data Security & Compliance",
    description:
      "Enterprise-grade security solutions ensuring your data and systems.",
    icon: ShieldCheck,
    color: "from-purple-500 to-indigo-500",
    details: [
      "Security audits and assessments",
      "Data encryption and protection",
      "Compliance frameworks (POPIA, GDPR)",
      "Vulnerability scanning",
      "Penetration testing",
      "Security monitoring",
    ],
  },
  "analytics-insights": {
    title: "Analytics & Insights",
    description:
      "Data-driven solutions to understand your customers and optimize your business.",
    icon: LineChart,
    color: "from-amber-500 to-orange-500",
    details: [
      "Data analytics and visualization",
      "Business intelligence dashboards",
      "Customer behavior analysis",
      "Performance metrics",
      "Predictive analytics",
      "Reporting solutions",
    ],
  },
  "mobile-solutions": {
    title: "Mobile Solutions",
    description:
      "Native and cross-platform mobile applications for any device.",
    icon: Smartphone,
    color: "from-teal-500 to-emerald-500",
    details: [
      "Native iOS and Android apps",
      "Cross-platform development",
      "Mobile UX/UI design",
      "App store deployment",
      "Mobile backend services",
      "Push notifications and analytics",
    ],
  },
  "digital-strategy": {
    title: "Digital Strategy",
    description:
      "Comprehensive digital transformation strategies tailored to your market.",
    icon: Rocket,
    color: "from-yellow-500 to-amber-500",
    details: [
      "Digital transformation roadmaps",
      "Technology strategy consulting",
      "Innovation workshops",
      "Market analysis",
      "Competitive benchmarking",
      "Change management",
    ],
  },
  consulting: {
    title: "Consulting Services",
    description:
      "Expert guidance on technology decisions, architecture, and transformation initiatives.",
    icon: Briefcase,
    color: "from-slate-500 to-gray-600",
    details: [
      "Technology advisory",
      "Architecture review",
      "Project governance",
      "Risk assessment",
      "Technology selection",
      "Digital maturity assessment",
    ],
  },
  "ai-services": {
    title: "AI Services",
    description:
      "Practical AI assistants, automation, and workflow intelligence for teams.",
    icon: Cpu,
    color: "from-emerald-500 to-blue-500",
    details: [
      "AI assistant design and implementation",
      "Workflow automation",
      "Document-aware chat experiences",
      "Predictive analytics",
      "Task and pipeline automation",
      "AI governance and rollout support",
    ],
  },
};

export default function ServicePage() {
  const params = useParams();
  const slug = params.slug as string;
  const service = servicesData[slug];

  if (!service) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-foreground">
            Service not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The service you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/services">
            <Button className="mt-4 bg-[#0f1f3d] hover:bg-[#10b981]">
              Back to Services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link href="/services">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>
      </Link>

      {/* Header */}
      <div
        className={`bg-gradient-to-br ${service.color} rounded-2xl p-8 text-white`}
      >
        <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold">{service.title}</h1>
        <p className="text-white/80 mt-2 max-w-2xl">{service.description}</p>
      </div>

      {/* Details */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          What We Offer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {service.details.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg"
            >
              <Check className="w-4 h-4 text-[#10b981] flex-shrink-0" />
              <span className="text-sm text-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact CTA */}
      <div className="text-center p-6 bg-muted/20 rounded-xl border border-border">
        <p className="text-muted-foreground mb-4">
          Interested in our {service.title}?
        </p>
        <Button className="bg-[#0f1f3d] hover:bg-[#10b981]">
          Discuss Project
        </Button>
      </div>
    </div>
  );
}
