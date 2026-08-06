import { useCallback, useState } from 'react';

export interface AIChatMessage {
  text: string;
  interactionId: string;
  actionExecuted?: boolean;
}

export interface UseAIAssistantOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: AIChatMessage) => void;
}

/**
 * Hook for interacting with the FlowOS AI assistant
 * Manages conversation state and API calls
 */
export function useAIAssistant(options?: UseAIAssistantOptions) {
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string, documents?: Array<{ name: string; extractedText?: string }>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage,
            previousInteractionId: interactionId,
            documents
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get response');
        }

        const data: AIChatMessage = await response.json();
        setInteractionId(data.interactionId);
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [interactionId, options]
  );

  const resetConversation = useCallback(() => {
    setInteractionId(null);
    setError(null);
  }, []);

  return {
    sendMessage,
    loading,
    error,
    interactionId,
    resetConversation
  };
}
