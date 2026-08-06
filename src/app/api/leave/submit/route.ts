import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  submitLeaveRequest,
  getUserLeaveRequests,
  SubmitLeaveRequestInput
} from '@/lib/leave-service';
import { LeaveType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type, startDate, endDate, reason, doctorsNoteDataUrl, doctorsNoteName } = body;

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const input: SubmitLeaveRequestInput = {
      type: type as LeaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      doctorsNoteDataUrl,
      doctorsNoteName
    };

    const leaveRequest = await submitLeaveRequest(user.id, input);

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return NextResponse.json(
      { error: 'Failed to submit leave request' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const leaveRequests = await getUserLeaveRequests(user.id);

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}
