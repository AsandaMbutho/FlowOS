import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractAction, executeAction } from '@/lib/ai-actions';
import { askAssistant } from '@/lib/ai-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userMessage, previousInteractionId, documents = [] } =
      await req.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'userMessage is required' },
        { status: 400 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const members = await prisma.user.findMany({
      select: { id: true, name: true },
    });

    const response = await askAssistant({
      previousInteractionId,
      userMessage,
      documents,
    });

    const { displayText, action } = extractAction(response.text);
    const actionConfirmation = action
      ? await executeAction(action, {
          members,
          executorUid: currentUser.id,
        })
      : null;

    return NextResponse.json({
      text: actionConfirmation
        ? `${displayText}\n\n${actionConfirmation}`
        : displayText,
      interactionId: response.interactionId,
      actionExecuted: Boolean(action),
    });
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
