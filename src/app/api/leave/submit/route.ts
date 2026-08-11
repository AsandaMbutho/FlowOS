import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  submitLeaveRequest,
  getUserLeaveRequests,
  SubmitLeaveRequestInput
} from '@/lib/leave-service';
import { LeaveType } from '@prisma/client';

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'PERSONAL'] as const;

function isLeaveType(value: unknown): value is LeaveType {
  return typeof value === 'string' && LEAVE_TYPES.includes(value as LeaveType);
}

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
    const {
      type,
      startDate,
      endDate,
      reason,
      doctorsNoteDataUrl,
      doctorsNoteName,
      isHalfDay,
      halfDayType,
    } = body;

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isLeaveType(type)) {
      return NextResponse.json(
        { error: 'Invalid leave type' },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start or end date' },
        { status: 400 }
      );
    }

    if (parsedStartDate > parsedEndDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const input: SubmitLeaveRequestInput = {
      type,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason: String(reason).trim(),
      doctorsNoteDataUrl,
      doctorsNoteName,
      isHalfDay: Boolean(isHalfDay),
      halfDayType,
    };

    const leaveRequest = await submitLeaveRequest(user.id, input);

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to submit leave request',
      },
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
