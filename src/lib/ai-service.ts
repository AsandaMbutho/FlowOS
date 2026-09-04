// Google Gemini AI Service for FlowOS
// Uses Gemini Interactions API for multi-turn conversations
// API key should be restricted to HTTP referrer in Google Cloud Console

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export interface GeminiResponse {
  text: string;
  interactionId: string;
}

export interface GeminiCallParams {
  input: string;
  systemInstruction?: string;
  previousInteractionId?: string;
}

/**
 * Call Google Gemini Interactions API directly
 * The Interactions API manages multi-turn conversation state server-side:
 * instead of resending the whole transcript every turn, we pass
 * previous_interaction_id and only send the new message.
 */
async function callGemini({
  input,
  systemInstruction,
  previousInteractionId
}: GeminiCallParams): Promise<GeminiResponse> {
  if (!API_KEY) {
    throw new Error(
      'Gemini API key is missing. Add NEXT_PUBLIC_GEMINI_API_KEY to your .env file.'
    );
  }

  const body: Record<string, unknown> = { model: MODEL, input };
  if (systemInstruction) body.system_instruction = systemInstruction;
  if (previousInteractionId) body.previous_interaction_id = previousInteractionId;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `Gemini API error (${res.status}): ${errBody.slice(0, 200)}`
    );
  }

  const data = await res.json();
  
  // Extract text from the response
  // The SDKs expose a convenience `.output_text` property; raw REST doesn't,
  // so we pull the last step's text content ourselves.
  const lastStep = data.steps?.[data.steps.length - 1];
  const textBlock = lastStep?.content?.find((c: { type: string }) => c.type === 'text');
  
  return {
    text: textBlock?.text || lastStep?.content?.[0]?.text || '(no response)',
    interactionId: data.id
  };
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
    previousInteractionId
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
