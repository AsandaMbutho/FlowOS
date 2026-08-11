"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, RotateCcw, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIAssistant } from "@/lib/hooks/use-ai-assistant";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
  actionExecuted?: boolean;
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
      text: "Hi, I am your FlowOS assistant. Ask me to summarize work, draft updates, create tasks, or add workflow items.",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
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

  const sendUserMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: userMessage,
        createdAt: new Date(),
      },
    ]);

    try {
      await sendMessage(userMessage);
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

        <div className="flex items-end gap-2">
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
            disabled={loading || !input.trim()}
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
