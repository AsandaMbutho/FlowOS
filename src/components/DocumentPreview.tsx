// components/DocumentPreview.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  File,
  FileText,
  Image,
  FileArchive,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
  file: {
    id: string;
    filename: string;
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
    createdAt: string;
  };
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function DocumentPreview({
  file,
  onClose,
  onDelete,
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

  const isImage = file.mimeType?.startsWith("image/");
  const isPDF = file.mimeType === "application/pdf";
  const isText =
    file.mimeType?.startsWith("text/") ||
    file.mimeType === "application/json" ||
    file.mimeType === "application/xml" ||
    file.filename?.endsWith(".md");
  const isVideo = file.mimeType?.startsWith("video/");
  const isAudio = file.mimeType?.startsWith("audio/");

  // Fetch file content for text files
  useEffect(() => {
    if (!isText) {
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error("Failed to load content");
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError("Failed to load file content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file.url, isText]);

  // Handle click outside to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="w-12 h-12 text-blue-500" />;
    if (isPDF) return <FileText className="w-12 h-12 text-red-500" />;
    if (isVideo) return <Video className="w-12 h-12 text-purple-500" />;
    if (isAudio) return <Music className="w-12 h-12 text-green-500" />;
    if (file.filename?.endsWith(".zip") || file.filename?.endsWith(".rar")) {
      return <FileArchive className="w-12 h-12 text-yellow-500" />;
    }
    return <File className="w-12 h-12 text-muted-foreground" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 z-50 bg-card rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {file.originalName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} · {file.mimeType || "Unknown type"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.originalName}
              className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${file.originalName}"?`)) {
                    onDelete(file.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-background/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={file.url}
                alt={file.originalName}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={`${file.url}#toolbar=1`}
              className="w-full h-full rounded-lg border border-border"
              title={file.originalName}
            />
          ) : isText && content !== null ? (
            <div className="h-full overflow-auto">
              <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap p-4 bg-muted/10 rounded-lg border border-border">
                {content}
              </pre>
            </div>
          ) : isVideo ? (
            <video controls className="w-full h-full rounded-lg" src={file.url}>
              Your browser does not support the video tag.
            </video>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#10b981] to-[#0d8a6a] flex items-center justify-center">
                <Music className="w-12 h-12 text-white" />
              </div>
              <audio controls className="w-full max-w-md" src={file.url}>
                Your browser does not support the audio tag.
              </audio>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              {getFileIcon()}
              <div>
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <a
                  href={file.url}
                  download={file.originalName}
                  className="text-[#10b981] hover:underline text-sm mt-2 inline-block"
                >
                  Download to view
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Add missing imports
import { Video, Music, Trash2, AlertTriangle } from "lucide-react";
