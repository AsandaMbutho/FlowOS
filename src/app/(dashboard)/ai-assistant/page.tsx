import { AIAssistantChat } from '@/components/ai/assistant-chat';

export default function AIAssistantPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">FlowOS AI Assistant</h1>
        <p className="text-muted-foreground text-sm">
          Chat with the AI to create tasks and workflow items
        </p>
      </div>
      <AIAssistantChat />
    </div>
  );
}
