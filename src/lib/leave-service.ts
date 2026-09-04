import { prisma } from "./prisma";
import { LeaveType } from "@prisma/client";
import {
  sendLeaveRequestDecisionNotification,
  sendLeaveRequestSubmittedNotifications,
} from "./email-notifications";


export interface SubmitLeaveRequestInput {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  doctorsNoteDataUrl?: string;
  doctorsNoteName?: string;
  isHalfDay?: boolean;
  halfDayType?: string;
}


/**
 * Submit a leave request for a user.
 */
export async function submitLeaveRequest(
  userId: string,
  input: SubmitLeaveRequestInput,
) {
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      status: "PENDING",
      doctorsNoteDataUrl: input.doctorsNoteDataUrl || null,
      doctorsNoteName: input.doctorsNoteName || null,
      isHalfDay: input.isHalfDay || false,
      halfDayType: input.isHalfDay ? input.halfDayType : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await sendLeaveRequestSubmittedNotifications(leaveRequest.id);

  return leaveRequest;
}

/**
 * Get leave requests for a user.
 */
export async function getUserLeaveRequests(userId: string) {
  return prisma.leaveRequest.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get all pending leave requests for managers/admins to review.
 */
export async function getPendingLeaveRequests() {
  return prisma.leaveRequest.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export interface DecideLeaveRequestInput {
  status: "APPROVED" | "REJECTED";
  reviewerId: string;
  managerNote?: string;
}

/**
 * Approve or reject a leave request.
 */
export async function decideLeaveRequest(
  leaveRequestId: string,
  input: DecideLeaveRequestInput,
) {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: {
      id: leaveRequestId,
    },
  });

  if (!leaveRequest) {
    throw new Error("Leave request not found");
  }

  const reviewer = await prisma.user.findUnique({
    where: {
      id: input.reviewerId,
    },
  });

  if (!reviewer) {
    throw new Error("Reviewer not found");
  }

  const updated = await prisma.leaveRequest.update({
    where: {
      id: leaveRequestId,
    },
    data: {
      status: input.status,
      managerNote: input.managerNote || null,
      reviewerId: input.reviewerId,
      reviewedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await sendLeaveRequestDecisionNotification(updated.id);

  return updated;
}

/**
 * Get all users currently on approved leave.
 */
export async function getUsersCurrentlyOnLeave() {
  const today = new Date();

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const usersOnLeave = await prisma.user.findMany({
    where: {
      leaveRequests: {
        some: {
          status: "APPROVED",
          startDate: {
            lte: endOfToday,
          },
          endDate: {
            gte: startOfToday,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      leaveRequests: {
        where: {
          status: "APPROVED",
          startDate: {
            lte: endOfToday,
          },
          endDate: {
            gte: startOfToday,
          },
        },
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          reason: true,
          isHalfDay: true,
          halfDayType: true,
        },
      },
    },
  });

  return usersOnLeave;
}

/**
 * Get a single leave request by ID.
 */
export async function getLeaveRequestById(leaveRequestId: string) {
  return prisma.leaveRequest.findUnique({
    where: {
      id: leaveRequestId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Polish a leave reason using the AI assistant.
 */
export async function polishLeaveReason(rawText: string): Promise<string> {
  const { polishLeaveReason: polishAI } = await import("./ai-service");

  return polishAI(rawText);
}
