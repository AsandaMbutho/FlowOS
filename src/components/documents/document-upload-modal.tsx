"use client";

import { useState } from "react";
import { X, Upload, File, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any) => void;
  workflowTitle?: string;
}

const projects = ["FlowOS", "CyberSafe", "E-Learning", "CRM"];

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  workflowTitle,
}: DocumentUploadModalProps) {
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !name) return;
    setUploading(true);
    try {
      // Simulate upload - replace with actual file upload
      const fileUrl = URL.createObjectURL(file);
      const fileSize = (file.size / 1024 / 1024).toFixed(1) + " MB";
      const fileType = file.name.split(".").pop()?.toUpperCase() || "Other";

      onUpload({
        name,
        fileUrl,
        fileType,
        fileSize,
        project: project || "flowos",
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Upload Document</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Document Name
            </label>
            <Input
              placeholder="e.g., Security_Report.pdf"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <button
                  key={p}
                  onClick={() => setProject(p.toLowerCase())}
                  className={`px-3 py-1.5 text-xs rounded-full border transition ${
                    project === p.toLowerCase()
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
              {workflowTitle && (
                <span className="text-xs text-muted-foreground flex items-center">
                  (Workflow: {workflowTitle})
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">File</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground">
                  {file ? file.name : "Click to select a file"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, XLS, PPT up to 10MB
                </p>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleUpload}
              disabled={!file || !name || uploading}
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
  );
}
