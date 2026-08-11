import { prisma } from "./prisma";
import { LeaveType } from "@prisma/client";

// Image compression constants for doctor's notes
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.6;
const MAX_DATA_URL_BYTES = 700 * 1024;

/**
 * Compress an image file to a data URL.
 * Browser-only utility used for doctor's notes.
 */
export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Could not read the file."));
    };

    reader.onload = () => {
      img.onerror = () => {
        reject(new Error("Could not read the image."));
      };

      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not create image canvas."));
          return;
        }

        context.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

        if (dataUrl.length > MAX_DATA_URL_BYTES) {
          reject(
            new Error(
              "Image is still too large after compression. Try a smaller photo or crop it tighter.",
            ),
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
