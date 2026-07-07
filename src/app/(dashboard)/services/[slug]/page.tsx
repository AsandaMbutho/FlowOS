"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const servicesData: Record<
  string,
  {
    title: string;
    description: string;
    icon: string;
    details: string[];
    color: string;
  }
> = {
  "web-development": {
    title: "Web Development",
    description:
      "Custom websites and web applications built with modern technologies.",
    icon: "🌐",
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
    icon: "🛡️",
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
    icon: "📊",
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
    icon: "📱",
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
    icon: "💡",
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
    icon: "💼",
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
};

export default function ServicePage() {
  const params = useParams();
  const slug = params.slug as string;
  const service = servicesData[slug];

  if (!service) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold">Service not found</h1>
          <p className="text-muted-foreground mt-2">
            The service you're looking for doesn't exist.
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

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link href="/services">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>
      </Link>

      {/* Header */}
      <div
        className={`bg-gradient-to-br ${service.color} rounded-2xl p-8 text-white`}
      >
        <div className="text-4xl mb-3">{service.icon}</div>
        <h1 className="text-3xl font-bold">{service.title}</h1>
        <p className="text-white/80 mt-2 max-w-2xl">{service.description}</p>
      </div>

      {/* Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {service.details.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-[#10b981] text-lg">✓</span>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact CTA */}
      <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-600 mb-4">Interested in our {service.title}?</p>
        <Button className="bg-[#0f1f3d] hover:bg-[#10b981]">
          Discuss Project
        </Button>
      </div>
    </div>
  );
}
