// Google Gemini AI Service for FlowOS
// Runs server-side through Next.js API routes, so the API key must not be
// exposed as NEXT_PUBLIC_*.

import { GoogleGenAI } from "@google/genai";

export interface GeminiResponse {
  text: string;
  interactionId: string;
}

export interface GeminiCallParams {
  input: string;
  systemInstruction?: string;
  previousInteractionId?: string;
}

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

/**
 * Call Gemini through the stateful Interactions API.
 */
async function callGemini({
  input,
  systemInstruction,
  previousInteractionId,
}: GeminiCallParams): Promise<GeminiResponse> {
  const apiKey = getGeminiApiKey();
  const model = cleanEnvValue(process.env.GEMINI_MODEL) || "gemini-3.6-flash";

  if (!apiKey) {
    throw new GeminiApiError(
      'Gemini API key is missing. Add GEMINI_API_KEY to your .env.local file and restart the server.',
      503,
    );
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 30_000);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create(
      {
        model,
        input,
        ...(systemInstruction && { system_instruction: systemInstruction }),
        ...(previousInteractionId && {
          previous_interaction_id: previousInteractionId,
        }),
        generation_config: {
          temperature: 0.35,
          top_p: 0.95,
          max_output_tokens: 1200,
        },
      },
      { abortSignal: abortController.signal },
    );

    const text = interaction.output_text?.trim();
    if (!text) {
      throw new GeminiApiError("Gemini returned an empty response.", 502);
    }

    return {
      text,
      interactionId: interaction.id,
    };
  } catch (error) {
    if (error instanceof GeminiApiError) throw error;

    const sdkError = error as { status?: number; message?: string; name?: string };
    const status = typeof sdkError.status === "number" ? sdkError.status : 503;
    const message = sdkError.name === "AbortError"
      ? "Gemini did not respond in time. Please try again."
      : sdkError.message || "Could not reach Gemini. Check the server internet connection and try again.";
    throw new GeminiApiError(message, status);
  } finally {
    clearTimeout(timeout);
  }
}

function getGeminiApiKey() {
  return cleanEnvValue(process.env.GEMINI_API_KEY)
    || cleanEnvValue(process.env.GOOGLE_API_KEY)
    || cleanEnvValue(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["'],?$/g, '');
}

export interface DocumentReference {
  name: string;
  extractedText?: string;
}

export interface AssistantOptions {
  previousInteractionId?: string;
  userMessage: string;
  documents?: DocumentReference[];
}

/**
 * General-purpose chat turn for FlowOS assistant
 * Pass the previous response's interactionId to continue the same conversation
 * Optionally grounds the answer in text extracted from uploaded documents
 */
export async function askAssistant({
  previousInteractionId,
  userMessage,
  documents = []
}: AssistantOptions): Promise<GeminiResponse> {
  const readableDocs = documents.filter((d) => d.extractedText);
  const docContext = readableDocs.length
    ? `\n\nHere are excerpts from files shared on the platform, in case they're relevant:\n${readableDocs
        .map((d) => `--- ${d.name} ---\n${d.extractedText}`)
        .join('\n\n')}\n\nIf you use one of these, mention its filename.`
    : '';

  const systemInstruction = `You are the FlowOS assistant, helping a team member inside a workflow app that tracks tasks, logged hours, a pipeline board, leave requests, and shared documents. Be concise and practical. Only reference the file excerpts below if the question is actually about them.

You can actually perform actions, not just talk about them. Respond with a short confirmation/answer sentence followed by a fenced block in exactly one of these forms when the request clearly calls for it:

To create a to-do item:
\`\`\`action
{"type": "create_task", "title": "...", "assignedToName": "..." }
\`\`\`

To create a pipeline/board card (a new workflow):
\`\`\`action
{"type": "create_workflow_item", "title": "...", "assignedToName": "..." }
\`\`\`

To find out who on the team has NOT yet commented/posted on a specific workflow (only emit this when the person names or clearly identifies a specific workflow — not for vague "how's everyone doing" questions):
\`\`\`action
{"type": "find_non_commenters", "workflowTitle": "..." }
\`\`\`

If they didn't name who a task/workflow is for, omit assignedToName (it'll default to them). Never emit an action block unless the request is unambiguous. Never emit more than one action block per reply. For find_non_commenters, use the workflow title as the person referred to it — it doesn't need to be exact, the system will match it.${docContext}`;

  return callGemini({
    input: userMessage,
    systemInstruction,
    previousInteractionId,
  });
}

/**
 * Polish a leave request reason into a professional sentence
 * One-shot call — no conversation history needed
 */
export async function polishLeaveReason(rawText: string): Promise<string> {
  const input = `Rewrite this leave request reason as one short, professional sentence suitable for a workplace system. Don't invent details that aren't there. Return only the rewritten sentence, nothing else.\n\nOriginal: "${rawText}"`;
  const { text } = await callGemini({ input });
  return text;
}
