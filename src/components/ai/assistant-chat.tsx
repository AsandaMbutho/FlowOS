'use client';

import { FormEvent, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIAssistant } from '@/lib/hooks/use-ai-assistant';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actionExecuted?: boolean;
};

export function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me to draft an update, summarize work, create a task, or add a workflow item.',
    },
  ]);
  const [input, setInput] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const { sendMessage, loading, error, resetConversation } = useAIAssistant({
    onSuccess: (message) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: message.text,
          actionExecuted: message.actionExecuted,
        },
      ]);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: userMessage },
    ]);

    try {
      await sendMessage(userMessage);
    } catch {
      // The hook exposes the error below the composer.
    }
  };

  const handleReset = () => {
    resetConversation();
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Conversation reset. What should we work on next?',
      },
    ]);
    formRef.current?.reset();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-8">
        {messages.map((message) => {
          const isUser = message.role === 'user';
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
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icon className="size-4" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[min(760px,85vw)] whitespace-pre-wrap rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm',
                  isUser
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-card-foreground',
                )}
              >
                {message.text}
                {message.actionExecuted && (
                  <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs opacity-80">
                    <Sparkles className="size-3.5" />
                    Action completed in FlowOS
                  </div>
                )}
              </div>

              {isUser && (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md border bg-card">
                  <Icon className="size-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="border-t bg-card/50 px-4 py-4 md:px-8"
      >
        {error && (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}

        <div className="flex gap-2">
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
            className="min-h-11 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
