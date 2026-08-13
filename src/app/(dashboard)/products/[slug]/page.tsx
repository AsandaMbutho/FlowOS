"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Workflow,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Rocket,
  ShieldCheck,
  BookOpen,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const productData: Record<
  string,
  {
    name: string;
    description: string;
    color: string;
    icon: LucideIcon;
    websiteUrl?: string;
  }
> = {
  flowos: {
    name: "FlowOS",
    description: "Workflow Operating System - The platform itself",
    color: "from-teal-500 to-emerald-500",
    icon: Rocket,
  },
  cybersafe: {
    name: "CyberSafe Africa",
    description: "Cybersecurity platform integration and protection",
    color: "from-red-500 to-orange-500",
    icon: ShieldCheck,
    websiteUrl: "https://cyber-safe-africa.vercel.app/",
  },
  elearning: {
    name: "E-Learning Platform",
    description: "Educational content delivery system",
    color: "from-blue-500 to-cyan-500",
    icon: BookOpen,
    websiteUrl:
      "https://media-on-africa-learning-hub.github.io/Media-On-Africa-Learning-Hub/index.html",
  },
  crm: {
    name: "CRM Real Estate Platform",
    description: "Property listings, client tracking, deal pipeline",
    color: "from-purple-500 to-pink-500",
    icon: Building2,
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = productData[slug];

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [workflowsRes, documentsRes] = await Promise.all([
          fetch("/api/workflows"),
          fetch(`/api/documents?project=${slug}`),
        ]);
        const workflowsData = await workflowsRes.json();
        const documentsData = await documentsRes.json();
        setWorkflows(Array.isArray(workflowsData) ? workflowsData : []);
        setDocuments(Array.isArray(documentsData) ? documentsData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Filter workflows related to this product
  const relatedWorkflows = workflows.filter((w) =>
    w.title.toLowerCase().includes(slug),
  );

  const totalWorkflows = relatedWorkflows.length;
  const completedWorkflows = relatedWorkflows.filter(
    (w) => w.progress === 100,
  ).length;
  const avgProgress =
    totalWorkflows > 0
      ? Math.round(
          relatedWorkflows.reduce((acc, w) => acc + (w.progress || 0), 0) /
            totalWorkflows,
        )
      : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">
          Product not found
        </h1>
        <Link href="/products" className="text-[#10b981] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  const Icon = product.icon;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <Link href="/products" className="inline-flex w-fit">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </Link>

      {/* Header */}
      <div
        className={`bg-gradient-to-br ${product.color} rounded-2xl p-8 text-white`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Icon className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-white/80 mt-2 max-w-2xl">
              {product.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="bg-white/20 rounded-lg px-4 py-2 text-sm">
              {totalWorkflows} workflows
            </div>
            {product.websiteUrl && (
              <a
                href={product.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white/90"
              >
                Open product <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <Workflow className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xl font-bold text-foreground">
                {totalWorkflows}
              </div>
              <div className="text-xs text-muted-foreground">Workflows</div>
            </div>
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xl font-bold text-foreground">
                {completedWorkflows}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-xl font-bold text-foreground">
                {avgProgress}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-xl font-bold text-foreground">
                {documents.length}
              </div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div className="card-depth p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <Workflow className="w-4 h-4" /> Related Workflows
          </h2>
          <Link href="/workflows">
            <button className="text-sm text-[#10b981] hover:underline">
              View all →
            </button>
          </Link>
        </div>
        {relatedWorkflows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workflows linked to this product yet.
          </p>
        ) : (
          <div className="space-y-2">
            {relatedWorkflows.map((w) => (
              <Link key={w.id} href={`/workflows/${w.id}`}>
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition">
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {w.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.assignee?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {w.progress}%
                    </span>
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-[#10b981]"
                        style={{ width: `${w.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="card-depth p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4" /> Documents
          </h2>
          <Link href="/documents">
            <button className="text-sm text-[#10b981] hover:underline">
              View all →
            </button>
          </Link>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents for this product yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate text-foreground">
                  {doc.name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {doc.fileType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
