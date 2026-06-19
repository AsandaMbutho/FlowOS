"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Edit2, Trash2, Check, X, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

interface CommentsSectionProps {
  workflowId: string;
  comments: Comment[];
  onCommentAdded: () => void;
}

export function CommentsSection({
  workflowId,
  comments,
  onCommentAdded,
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentUserId = session?.user?.id;

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          body: newComment.trim(),
          authorId: currentUserId,
        }),
      });

      if (res.ok) {
        setNewComment("");
        onCommentAdded();
      } else {
        console.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle editing a comment
  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditingText(comment.body);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) return;

    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editingText.trim() }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditingText("");
        onCommentAdded();
      } else {
        console.error("Failed to edit comment");
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  // Handle deleting a comment
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onCommentAdded();
      } else {
        console.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Helper to format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Add comment input */}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment... Use @ to mention someone"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={handleAddComment}
          disabled={sending || !newComment.trim()}
        >
          <Send className="w-4 h-4 mr-1" />
          Send
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const isAuthor = comment.author?.id === currentUserId;
            const isEditing = editingId === comment.id;
            const isDeleting = deletingId === comment.id;

            return (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-teal-600" />
                    </div>
                    <span className="font-medium text-sm">
                      {comment.author?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>

                  {/* Edit/Delete buttons - only for author */}
                  {isAuthor && !isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit mode or display mode */}
                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(comment.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                    />
                    <button
                      onClick={() => saveEdit(comment.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">
                    {comment.body}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
