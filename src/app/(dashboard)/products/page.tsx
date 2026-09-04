"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Workflow, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

const products = [
  {
    id: "flowos",
    name: "FlowOS",
    description: "Workflow Operating System - The platform itself",
    icon: "🚀",
    color: "from-teal-500 to-emerald-500",
  },
  {
    id: "cybersafe",
    name: "CyberSafe Africa",
    description: "Cybersecurity platform integration and protection",
    icon: "🛡️",
    color: "from-red-500 to-orange-500",
    websiteUrl: "https://cyber-safe-africa.vercel.app/",
  },
  {
    id: "elearning",
    name: "E-Learning Platform",
    description: "Educational content delivery system",
    icon: "📚",
    color: "from-blue-500 to-cyan-500",
    websiteUrl:
      "https://media-on-africa-learning-hub.github.io/Media-On-Africa-Learning-Hub/index.html",
  },
  {
    id: "crm",
    name: "CRM Real Estate Platform",
    description: "Property listings, client tracking, deal pipeline",
    icon: "🏢",
    color: "from-purple-500 to-pink-500",
  },
];

export default function ProductsPage() {
  const [stats, setStats] = useState<
    Record<string, { workflows: number; documents: number }>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [workflowsRes, documentsRes] = await Promise.all([
          fetch("/api/workflows"),
          fetch("/api/documents"),
        ]);
        const workflows = await workflowsRes.json();
        const documents = await documentsRes.json();

        const productStats: Record<
          string,
          { workflows: number; documents: number }
        > = {};
        for (const product of products) {
          const workflowCount = workflows.filter((w: any) =>
            w.title.toLowerCase().includes(product.id),
          ).length;
          const documentCount = documents.filter(
            (d: any) => d.project === product.id,
          ).length;
          productStats[product.id] = {
            workflows: workflowCount,
            documents: documentCount,
          };
        }
        setStats(productStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground text-sm">
          Manage your product portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const stat = stats[product.id] || { workflows: 0, documents: 0 };
          return (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-border hover:border-accent/40 group cursor-pointer h-full">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center text-2xl mb-4`}
                >
                  {product.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[#10b981] transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {product.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Workflow className="w-3.5 h-3.5" /> {stat.workflows}{" "}
                    workflows
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {stat.documents}{" "}
                    documents
                  </span>
                </div>
                <div className="flex items-center text-sm font-medium text-[#10b981] group-hover:gap-2 transition-all mt-3">
                  View Product{" "}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:ml-2 transition-all" />
                </div>
                {product.websiteUrl && (
                  <div className="flex items-center text-xs font-medium text-muted-foreground mt-2">
                    Product site <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
