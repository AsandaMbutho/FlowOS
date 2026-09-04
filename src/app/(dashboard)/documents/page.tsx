"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Folder,
  Download,
  Trash2,
  Eye,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  project: string;
  workflowId: string | null;
  workflow: { title: string } | null;
  user: { name: string } | null;
  createdAt: string;
}

const projectColors: Record<string, string> = {
  flowos: "bg-teal-100 text-teal-700",
  cybersafe: "bg-red-100 text-red-700",
  elearning: "bg-blue-100 text-blue-700",
  crm: "bg-purple-100 text-purple-700",
  medtrack: "bg-cyan-100 text-cyan-700",
  uncategorized: "bg-slate-100 text-slate-600",
};

const projectLabels: Record<string, string> = {
  flowos: "Flowos",
  cybersafe: "Cybersafe",
  elearning: "Elearning",
  crm: "Crm",
  medtrack: "MedTrack",
  uncategorized: "Uncategorized",
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-700",
  DOC: "bg-blue-100 text-blue-700",
  XLS: "bg-emerald-100 text-emerald-700",
  PPT: "bg-orange-100 text-orange-700",
  Other: "bg-muted text-muted-foreground",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProject, setUploadProject] = useState("flowos");
  const [uploadWorkflowId, setUploadWorkflowId] = useState("");

  const projects = [
    "all",
    "flowos",
    "cybersafe",
    "elearning",
    "crm",
    "medtrack",
    "uncategorized",
  ];

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("project", uploadProject);
      if (uploadWorkflowId) formData.append("workflowId", uploadWorkflowId);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchDocuments();
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadProject("flowos");
        setUploadWorkflowId("");
      } else {
        const error = await res.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      await fetchDocuments();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleView = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesProject =
      selectedProject === "all" || doc.project === selectedProject;
    return matchesSearch && matchesProject;
  });

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
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm">
            Manage documents organized by project
          </p>
        </div>
        <Button
          className="bg-[#0f1f3d] text-white hover:bg-[#10b981] hover:text-white text-sm"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Upload Document
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {projects.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProject(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                selectedProject === p
                  ? "bg-[#0f1f3d] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p === "all" ? "All" : projectLabels[p] || p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No documents found</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => setShowUploadModal(true)}
          >
            Upload your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <Card key={doc.id} className="p-4 hover:shadow-md transition group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate max-w-[150px]">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${typeColors[doc.fileType] || "bg-muted"}`}
                      >
                        {doc.fileType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {doc.fileSize}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-muted-foreground hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${projectColors[doc.project] || "bg-muted"}`}
                >
                  {projectLabels[doc.project] || doc.project}
                </span>
                {doc.workflow && (
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                    {doc.workflow.title}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {doc.user?.name || "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleView(doc.fileUrl)}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> View
                </button>
                <button
                  onClick={() => handleDownload(doc.fileUrl, doc.name)}
                  className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Upload Document</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border rounded-lg p-2"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Project
                </label>
                <div className="flex flex-wrap gap-2">
                  {["flowos", "cybersafe", "elearning", "crm", "medtrack"].map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setUploadProject(p)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition ${
                          uploadProject === p
                            ? "bg-[#0f1f3d] text-white border-[#0f1f3d]"
                            : "bg-card text-muted-foreground border-border hover:border-muted-foreground"
                        }`}
                      >
                        {projectLabels[p] || p}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#0f1f3d] hover:bg-[#10b981]"
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-1.5" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
