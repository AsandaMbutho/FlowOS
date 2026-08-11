'use client';

import { useEffect } from 'react';
import { usePendingLeaveRequests, LeaveRequest } from '@/lib/hooks/use-leave-requests';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TYPE_LABELS = {
  ANNUAL: 'Annual leave',
  SICK: 'Sick leave',
  PERSONAL: 'Personal',
};

export function LeaveRequestsReview() {
  const { pendingRequests, loading, fetchPendingRequests, decideRequest } =
    usePendingLeaveRequests();

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  if (loading && pendingRequests.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading pending leave requests...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Pending Leave Requests ({pendingRequests.length})
      </h3>

      {pendingRequests.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending leave requests</p>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request: LeaveRequest) => (
            <div
              key={request.id}
              className="p-4 border border-border rounded-lg"
            >
              <div className="mb-3">
                <p className="font-semibold">
                  {request.user?.name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {request.user?.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Leave Type
                  </p>
                  <p className="font-medium">
                    {TYPE_LABELS[request.type as keyof typeof TYPE_LABELS]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="font-medium">
                    {new Date(request.startDate).toLocaleDateString()} -{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {request.reason && (
                <div className="mb-3 p-3 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Reason
                  </p>
                  <p className="text-sm">{request.reason}</p>
                </div>
              )}

              {request.doctorsNoteDataUrl && (
                <div className="mb-3">
                  <a
                    href={request.doctorsNoteDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View doctor's note
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  onClick={() => decideRequest(request.id, 'APPROVED')}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => decideRequest(request.id, 'REJECTED')}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
