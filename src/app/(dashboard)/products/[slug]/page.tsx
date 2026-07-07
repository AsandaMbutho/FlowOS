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
} from "lucide-react";
import { Card } from "@/components/ui/card";

const productData: Record<
  string,
  { name: string; description: string; color: string; icon: string }
> = {
  flowos: {
    name: "FlowOS",
    description: "Workflow Operating System - The platform itself",
    color: "from-teal-500 to-emerald-500",
    icon: "🚀",
  },
  cybersafe: {
    name: "CyberSafe Africa",
    description: "Cybersecurity platform integration and protection",
    color: "from-red-500 to-orange-500",
    icon: "🛡️",
  },
  elearning: {
    name: "E-Learning Platform",
    description: "Educational content delivery system",
    color: "from-blue-500 to-cyan-500",
    icon: "📚",
  },
  crm: {
    name: "CRM Real Estate Platform",
    description: "Property listings, client tracking, deal pipeline",
    color: "from-purple-500 to-pink-500",
    icon: "🏢",
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
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/products" className="text-[#10b981] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <Link href="/products">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </Link>

      {/* Header */}
      <div
        className={`bg-gradient-to-br ${product.color} rounded-2xl p-8 text-white`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-4xl mb-3">{product.icon}</div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-white/80 mt-2 max-w-2xl">
              {product.description}
            </p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2 text-sm">
            {totalWorkflows} workflows
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <Workflow className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xl font-bold">{totalWorkflows}</div>
              <div className="text-xs text-muted-foreground">Workflows</div>
            </div>
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xl font-bold">{completedWorkflows}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-xl font-bold">{avgProgress}%</div>
              <div className="text-xs text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </div>
        <div className="card-depth p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-xl font-bold">{documents.length}</div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div className="card-depth p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Workflow className="w-4 h-4" /> Related Workflows
          </h2>
          <Link href="/workflows">
            <button className="text-sm text-[#10b981] hover:underline">
              View all →
            </button>
          </Link>
        </div>
        {relatedWorkflows.length === 0 ? (
          <p className="text-sm text-gray-400">
            No workflows linked to this product yet.
          </p>
        ) : (
          <div className="space-y-2">
            {relatedWorkflows.map((w) => (
              <Link key={w.id} href={`/workflows/${w.id}`}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-sm">{w.title}</p>
                    <p className="text-xs text-gray-400">
                      {w.assignee?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{w.progress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
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
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documents
          </h2>
          <Link href="/documents">
            <button className="text-sm text-[#10b981] hover:underline">
              View all →
            </button>
          </Link>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-400">
            No documents for this product yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm truncate">{doc.name}</span>
                <span className="text-xs text-gray-400 ml-auto">
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
