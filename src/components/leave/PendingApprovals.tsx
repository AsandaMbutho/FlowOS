"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";

type LeaveRequest = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string | null;
  isHalfDay: boolean;
  halfDayType?: "MORNING" | "AFTERNOON";
  user: {
    name: string;
    email: string;
  };
};

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  PERSONAL: "Personal Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  UNPAID: "Unpaid Leave",
  OTHER: "Other",
};

export default function PendingApprovals() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isSupervisor = session?.user?.role === "MANAGER";

  useEffect(() => {
    if (isSupervisor) {
      fetchPendingRequests();
      return;
    }

    setRequests([]);
    setLoading(false);
  }, [isSupervisor]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leave/decide");
      if (!res.ok) throw new Error("Failed to fetch pending requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this leave request?")) return;

    try {
      const res = await fetch(`/api/leave/requests/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          managerNote: "Approved by manager",
        }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      alert("✅ Request approved!");
      fetchPendingRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("❌ Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this leave request?")) return;

    try {
      const res = await fetch(`/api/leave/requests/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          managerNote: "Rejected by manager",
        }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      alert("❌ Request rejected!");
      fetchPendingRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("❌ Failed to reject request");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground">No pending requests</p>
            <p className="text-sm text-muted-foreground">
              All requests have been reviewed! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pending Requests</h3>
        <Badge variant="outline">{requests.length} requests</Badge>
      </div>

      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-yellow-500">PENDING</Badge>
                  <span className="font-medium">{request.user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {leaveTypeLabels[request.type] || request.type}
                  </span>
                  {request.isHalfDay && (
                    <Badge variant="outline">
                      {request.halfDayType === "MORNING"
                        ? "☀️ Morning"
                        : "🌙 Afternoon"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.startDate), "MMM d, yyyy")}
                  {request.startDate !== request.endDate &&
                    ` - ${format(new Date(request.endDate), "MMM d, yyyy")}`}
                  {request.reason && (
                    <span className="ml-2">• {request.reason}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.user.email}
                </p>
              </div>

              {isSupervisor && (
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 flex-1 md:flex-none"
                    onClick={() => handleApprove(request.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 md:flex-none"
                    onClick={() => handleReject(request.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
