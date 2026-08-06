import { prisma } from './prisma';

// The assistant is instructed to emit a fenced ```action { ... }``` JSON block
// when the user clearly asks it to create a task or workflow item. This is
// intentionally simple pattern-matching rather than tool-calling; kept
// this way so behavior is easy to read, debug, and extend.

const ACTION_BLOCK = /```action\s*([\s\S]*?)```/;

export interface ExtractedAction {
  displayText: string;
  action: ParsedAction | null;
}

export interface ParsedAction {
  type: 'create_task' | 'create_workflow_item';
  title: string;
  assignedToName?: string;
  dueDate?: string;
}

/**
 * Splits the assistant's raw reply into { displayText, action }
 * displayText has the action block stripped out (users shouldn't see raw JSON)
 * action is null if it wasn't present or didn't parse
 */
export function extractAction(replyText: string): ExtractedAction {
  const match = replyText.match(ACTION_BLOCK);
  if (!match) {
    return { displayText: replyText.trim(), action: null };
  }

  const displayText = replyText.replace(ACTION_BLOCK, '').trim();
  try {
    const action = JSON.parse(match[1].trim()) as ParsedAction;
    return { displayText, action };
  } catch {
    return { displayText, action: null };
  }
}

/**
 * Loosely matches a name the model produced (which may be partial, or
 * missing entirely) against the organization's member list.
 * Falls back to the person executing the action if nothing matches.
 */
async function resolveAssignee(
  name: string | undefined,
  members: Array<{ id: string; name: string | null }>,
  fallbackUid: string
): Promise<string> {
  if (!name) return fallbackUid;

  const found = members.find(
    (m) =>
      m.name && m.name.toLowerCase().includes(name.toLowerCase())
  );

  return found?.id || fallbackUid;
}

export interface ExecuteActionOptions {
  members?: Array<{ id: string; name: string | null }>;
  executorUid: string;
}

/**
 * Executes the parsed action against the database
 * Returns a short human-readable confirmation to append to the assistant's reply
 */
export async function executeAction(
  action: ParsedAction | null,
  { members = [], executorUid }: ExecuteActionOptions
): Promise<string | null> {
  if (!action?.type) return null;

  try {
    switch (action.type) {
      case 'create_task': {
        const assignedTo = await resolveAssignee(
          action.assignedToName,
          members,
          executorUid
        );

        // Create a workflow/pipeline item as a task container
        // (since tasks require a workflowId in your schema)
        const workflow = await prisma.workflow.create({
          data: {
            title: action.title,
            assigneeId: assignedTo,
            tags: '',
            stage: 'TODO',
            dueDate: action.dueDate ? new Date(action.dueDate) : null
          },
          include: { assignee: true }
        });

        // Create a task under the workflow
        await prisma.task.create({
          data: {
            title: action.title,
            assigneeId: assignedTo,
            workflowId: workflow.id
          }
        });

        const name = workflow.assignee?.name || 'you';
        return `Created task "${action.title}" for ${name}.`;
      }

      case 'create_workflow_item': {
        const assignedTo = await resolveAssignee(
          action.assignedToName,
          members,
          executorUid
        );

        const workflow = await prisma.workflow.create({
          data: {
            title: action.title,
            assigneeId: assignedTo,
            tags: '',
            stage: 'TODO'
          },
          include: { assignee: true }
        });

        const name = workflow.assignee?.name || 'you';
        return `Added "${action.title}" to the pipeline board for ${name}.`;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error executing AI action:', error);
    throw error;
  }
}
