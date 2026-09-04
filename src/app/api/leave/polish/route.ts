import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { polishLeaveReason } from '@/lib/leave-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const polished = await polishLeaveReason(text);

    return NextResponse.json({ polished });
  } catch (error) {
    console.error('Error polishing leave reason:', error);
    return NextResponse.json(
      { error: 'Failed to polish reason' },
      { status: 500 }
    );
  }
}
