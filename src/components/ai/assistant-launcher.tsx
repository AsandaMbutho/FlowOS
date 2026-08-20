"use client";

import { useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AIAssistantChat } from "@/components/ai/assistant-chat";
import { cn } from "@/lib/utils";

export function AIAssistantLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/ai-assistant") return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div
        className={cn(
          "mb-4 h-[min(680px,calc(100vh-7rem))] w-[min(420px,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-xl border border-border bg-background shadow-2xl transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                FlowOS Assistant
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                Ask questions or create workflows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close FlowOS assistant"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex h-[calc(100%-57px)] min-h-0 flex-col">
          <AIAssistantChat />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/15 transition hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-ring"
        aria-label={open ? "Close FlowOS assistant" : "Open FlowOS assistant"}
        title={open ? "Close FlowOS assistant" : "Open FlowOS assistant"}
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}
