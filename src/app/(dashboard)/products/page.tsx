"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Workflow,
  FileText,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  websiteUrl: string | null;
};

const COLOR_PRESETS = [
  "from-teal-500 to-emerald-500",
  "from-red-500 to-orange-500",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-amber-500 to-yellow-500",
  "from-slate-500 to-slate-600",
];

const ICON_PRESETS = ["📦", "🚀", "📚", "🏢", "🛡️", "💡", "📊", "🎯"];

const EMPTY_FORM = {
  name: "",
  description: "",
  websiteUrl: "",
  icon: ICON_PRESETS[0],
  color: COLOR_PRESETS[0],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<
    Record<string, { workflows: number; documents: number }>
  >({});
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [productsRes, workflowsRes, documentsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/workflows"),
        fetch("/api/documents"),
      ]);
      const productsData: Product[] = await productsRes.json();
      const workflows = await workflowsRes.json();
      const documents = await documentsRes.json();

      const productStats: Record<
        string,
        { workflows: number; documents: number }
      > = {};
      for (const product of productsData) {
        const workflowCount = Array.isArray(workflows)
          ? workflows.filter((w: any) =>
              w.title.toLowerCase().includes(product.slug),
            ).length
          : 0;
        const documentCount = Array.isArray(documents)
          ? documents.filter((d: any) => d.project === product.slug).length
          : 0;
        productStats[product.slug] = {
          workflows: workflowCount,
          documents: documentCount,
        };
      }

      setProducts(productsData);
      setStats(productStats);
    } catch (fetchError) {
      console.error("Failed to fetch products:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setError("Give the product a name and a short description.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          websiteUrl: form.websiteUrl || undefined,
          icon: form.icon,
          color: form.color,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add product");

      // Show it immediately without waiting on a full reload.
      setProducts((prev) => [...prev, result]);
      setStats((prev) => ({ ...prev, [result.slug]: { workflows: 0, documents: 0 } }));
      setModalOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not add product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">
            Manage your product portfolio
          </p>
        </div>
        <Button
          className="bg-[#0f1f3d] text-white hover:bg-[#10b981] hover:text-white"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const stat = stats[product.slug] || { workflows: 0, documents: 0 };
          return (
            <Link key={product.id} href={`/products/${product.slug}`}>
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Add product</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Inventory Manager"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="One line describing what this product is"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Website URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                />
              </div>

              <div>
                <Label>Icon</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {ICON_PRESETS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`h-9 w-9 rounded-lg border-2 flex items-center justify-center text-lg ${
                        form.icon === icon ? "border-foreground" : "border-transparent bg-muted"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`h-8 w-8 rounded-full bg-gradient-to-br ${color} border-2 ${
                        form.color === color ? "border-foreground" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
