DO $$ BEGIN
    CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'PERSONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'SICK',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "halfDayType" TEXT,
    "doctorsNoteDataUrl" TEXT,
    "doctorsNoteName" TEXT,
    "managerNote" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "type" "LeaveType" NOT NULL DEFAULT 'SICK';
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "isHalfDay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "halfDayType" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "doctorsNoteDataUrl" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "doctorsNoteName" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "managerNote" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "reviewerId" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "LeaveBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "annualEntitlement" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "annualUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualCarryOver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sickEntitlement" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "sickUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sickCarryOver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "personalEntitlement" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "personalUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_userId_key" ON "LeaveBalance"("userId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");

DO $$ BEGIN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
