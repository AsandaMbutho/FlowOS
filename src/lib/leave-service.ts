import { prisma } from './prisma';
import { LeaveType, Prisma } from '@prisma/client';

// Image compression constants for doctor's notes
const MAX_DIMENSION = 1200; // px, longest side after resize
const JPEG_QUALITY = 0.6;
const MAX_DATA_URL_BYTES = 700 * 1024; // leaves headroom under PostgreSQL's limits

/**
 * Compress an image file to a data URL (client-side utility)
 * Used for doctor's notes - images are compressed and stored as base64
 * This is a browser-only function
 */
export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      img.onerror = () => reject(new Error('Could not read the image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        if (dataUrl.length > MAX_DATA_URL_BYTES) {
          reject(
            new Error(
              'Image is still too large after compression. Try a smaller photo or crop it tighter.'
            )
          );
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface SubmitLeaveRequestInput {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  doctorsNoteDataUrl?: string;
  doctorsNoteName?: string;
}

/**
 * Submit a leave request for a user
 */
export async function submitLeaveRequest(
  userId: string,
  input: SubmitLeaveRequestInput
) {
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      status: 'PENDING',
      doctorsNoteDataUrl: input.doctorsNoteDataUrl || null,
      doctorsNoteName: input.doctorsNoteName || null
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });

  return leaveRequest;
}

/**
 * Get leave requests for a user
 */
export async function getUserLeaveRequests(userId: string) {
  return prisma.leaveRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      approvedByUser: { select: { name: true } }
    }
  });
}

/**
 * Get all pending leave requests (for managers/admins to review)
 */
export async function getPendingLeaveRequests() {
  return prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvedByUser: { select: { name: true } }
    }
  });
}

export interface DecideLeaveRequestInput {
  status: 'APPROVED' | 'DENIED';
  decidedBy: string; // User ID of the approver
}

/**
 * Approve or deny a leave request
 * If approved, updates the user's currentLeave field for availability checking
 */
export async function decideLeaveRequest(
  leaveRequestId: string,
  input: DecideLeaveRequestInput
) {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId }
  });

  if (!leaveRequest) {
    throw new Error('Leave request not found');
  }

  // Update the leave request
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      status: input.status,
      decidedAt: new Date(),
      decidedBy: input.decidedBy
    },
    include: {
      user: { select: { name: true } },
      approvedByUser: { select: { name: true } }
    }
  });

  // Update user's currentLeave if approved
  if (input.status === 'APPROVED') {
    await prisma.user.update({
      where: { id: leaveRequest.userId },
      data: {
        currentLeave: {
          type: leaveRequest.type,
          startDate: leaveRequest.startDate.toISOString(),
          endDate: leaveRequest.endDate.toISOString()
        }
      }
    });
  } else if (input.status === 'DENIED') {
    // Clear currentLeave if denying
    await prisma.user.update({
      where: { id: leaveRequest.userId },
      data: { currentLeave: Prisma.JsonNull }
    });
  }

  return updated;
}

/**
 * Get all users currently on leave (for availability view)
 */
export async function getUsersCurrentlyOnLeave() {
  const today = new Date().toISOString().split('T')[0];
  
  const usersOnLeave = await prisma.user.findMany({
    where: {
      leaveRequests: {
        some: {
          status: 'APPROVED',
          startDate: { lte: new Date(today) },
          endDate: { gte: new Date(today) }
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      leaveRequests: {
        where: {
          status: 'APPROVED',
          startDate: { lte: new Date(today) },
          endDate: { gte: new Date(today) }
        },
        select: {
          type: true,
          startDate: true,
          endDate: true,
          reason: true
        }
      }
    }
  });

  return usersOnLeave;
}

/**
 * Polish a leave reason using the AI assistant
 */
export async function polishLeaveReason(rawText: string): Promise<string> {
  const { polishLeaveReason: polishAI } = await import('./ai-service');
  return polishAI(rawText);
}
