"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  FileText,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIAssistant } from "@/lib/hooks/use-ai-assistant";
import { cn } from "@/lib/utils";

type AttachedDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  extractedText?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
  actionExecuted?: boolean;
  attachments?: AttachedDocument[];
};

const QUICK_PROMPTS = [
  "Summarize my current workflows",
  "Create a task for tomorrow",
  "Draft a supervisor update",
  "What needs attention today?",
];

export function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello, I am your FlowOS assistant, How can I assist you today?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { sendMessage, loading, error, resetConversation } = useAIAssistant({
    onSuccess: (message) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: message.text,
          createdAt: new Date(),
          actionExecuted: message.actionExecuted,
        },
      ]);
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const sendUserMessage = async (
    text: string,
    documents = attachments,
  ) => {
    const userMessage = text.trim();
    if ((!userMessage && documents.length === 0) || loading) return;

    setInput("");
    setAttachments([]);
    setAttachmentError("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: userMessage || "Please review the attached file.",
        createdAt: new Date(),
        attachments: documents,
      },
    ]);

    try {
      await sendMessage(userMessage || "Please review the attached file.", documents);
    } catch {
      // The hook exposes the error below the composer.
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendUserMessage(input);
  };

  const handleReset = () => {
    resetConversation();
    setAttachments([]);
    setAttachmentError("");
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Conversation reset. What should we work on next?",
        createdAt: new Date(),
      },
    ]);
    formRef.current?.reset();
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((file) => file.id !== id));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setAttachmentError("");

    const nextAttachments: AttachedDocument[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setAttachmentError("Files must be 5MB or smaller.");
        continue;
      }

      const isTextLike =
        file.type.startsWith("text/") ||
        [
          "application/json",
          "application/xml",
          "application/csv",
          "text/csv",
          "text/markdown",
        ].includes(file.type) ||
        /\.(csv|json|md|txt|log|xml|html|css|js|ts|tsx)$/i.test(file.name);

      let extractedText: string | undefined;
      if (isTextLike) {
        extractedText = (await file.text()).slice(0, 12000);
      }

      nextAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "Unknown type",
        size: file.size,
        extractedText,
      });
    }

    setAttachments((current) => [...current, ...nextAttachments].slice(0, 5));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-5 md:px-8">
        {messages.map((message) => {
          const isUser = message.role === "user";
          const Icon = isUser ? User : Bot;

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                isUser ? 'justify-end' : 'justify-start',
              )}
            >
              {!isUser && (
                <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Icon className="size-4" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[min(760px,82vw)] whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm",
                  isUser
                    ? "rounded-br-md border-primary bg-primary text-primary-foreground"
                    : "rounded-bl-md border-border bg-card text-card-foreground",
                )}
              >
                {message.text}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {message.attachments.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                          isUser
                            ? "border-primary-foreground/20 bg-primary-foreground/10"
                            : "border-border bg-muted/40",
                        )}
                      >
                        <FileText className="size-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    "mt-2 text-[11px]",
                    isUser ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {message.createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {message.actionExecuted && (
                  <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs opacity-80">
                    <Sparkles className="size-3.5" />
                    Action completed in FlowOS
                  </div>
                )}
              </div>

              {isUser && (
                <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground">
                  <Icon className="size-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 pl-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
              <Loader2 className="size-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="border-t border-border bg-card/80 px-3 py-4 backdrop-blur md:px-8"
      >
        {error && (
          <p className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </p>
        )}

        {messages.length === 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendUserMessage(prompt)}
                disabled={loading}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {attachmentError && (
          <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {attachmentError}
          </p>
        )}

        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
              >
                <FileText className="size-3.5 shrink-0" />
                <span className="max-w-48 truncate">{file.name}</span>
                <span className="shrink-0">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.pdf,.doc,.docx,.xls,.xlsx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || attachments.length >= 5}
          >
            <Paperclip className="size-4" />
            <span className="sr-only">Attach files</span>
          </Button>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder="Message the FlowOS assistant..."
            className="min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            disabled={loading || (!input.trim() && attachments.length === 0)}
          >
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw className="size-4" />
            <span className="sr-only">Reset conversation</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
