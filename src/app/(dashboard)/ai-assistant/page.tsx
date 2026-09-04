import { AIAssistantChat } from "@/components/ai/assistant-chat";

export default function AIAssistantPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border bg-card px-5 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          FlowOS AI Assistant
        </h1>
        <p className="text-muted-foreground text-sm">
          Chat with the AI to create tasks, draft updates, and work through your flows.
        </p>
      </div>
      <AIAssistantChat />
    </div>
  );
}
