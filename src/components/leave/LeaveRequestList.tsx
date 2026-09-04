"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type LeaveRequest = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string | null;
  isHalfDay: boolean;
  halfDayType?: "MORNING" | "AFTERNOON";
  user: {
    name: string;
    email: string;
  };
};

const statusColors = {
  PENDING: "bg-yellow-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-gray-500",
};

const leaveTypeLabels = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  PERSONAL: "Personal Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  UNPAID: "Unpaid Leave",
  OTHER: "Other",
};

export default function LeaveRequestList() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = `/api/leave/requests${filter !== "ALL" ? `?status=${filter}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      const res = await fetch(`/api/leave/requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel request");
      fetchRequests();
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No leave requests found</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/leave/new">Create your first request</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Requests</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={statusColors[request.status]}>
                  {request.status}
                </Badge>
                <span className="font-medium">
                  {
                    leaveTypeLabels[
                      request.type as keyof typeof leaveTypeLabels
                    ]
                  }
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
                {request.reason && ` • ${request.reason}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {request.status === "PENDING" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => cancelRequest(request.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
