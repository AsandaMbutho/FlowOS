"use client";

import { useSession } from "next-auth/react";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { LeaveRequestsReview } from "@/components/leave/leave-requests-review";

export default function LeavePage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canReview = role === "MANAGER";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
        <p className="text-sm text-muted-foreground">
          Submit leave, track decisions, and review pending requests.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <LeaveRequestForm />
        <LeaveRequestsList />
      </div>

      {canReview && <LeaveRequestsReview />}
    </div>
  );
}
