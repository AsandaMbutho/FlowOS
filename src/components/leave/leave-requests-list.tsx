'use client';

import { useEffect } from 'react';
import { useLeaveRequests, LeaveRequest } from '@/lib/hooks/use-leave-requests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TYPE_LABELS = {
  ANNUAL: 'Annual leave',
  SICK: 'Sick leave',
  PERSONAL: 'Personal',
};

const STATUS_LABELS = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  APPROVED: 'bg-green-500/10 text-green-700 dark:text-green-300',
  REJECTED: 'bg-red-500/10 text-red-700 dark:text-red-300',
};

export function LeaveRequestsList() {
  const { leaveRequests, loading, fetchMyRequests } = useLeaveRequests();

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  if (loading && leaveRequests.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading your leave requests...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Your Leave Requests</h3>
      
      {leaveRequests.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave requests yet</p>
      ) : (
        <div className="space-y-3">
          {leaveRequests.map((request: LeaveRequest) => (
            <div
              key={request.id}
              className="p-4 border border-border rounded-lg hover:bg-muted/40 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">
                    {TYPE_LABELS[request.type as keyof typeof TYPE_LABELS]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.startDate).toLocaleDateString()} to{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]
                  }
                >
                  {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>

              {request.reason && (
                <p className="text-sm text-foreground/80 mb-2">
                  Reason: {request.reason}
                </p>
              )}

              {request.doctorsNoteDataUrl && (
                <a
                  href={request.doctorsNoteDataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View doctor's note
                </a>
              )}

              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>
                  Submitted:{' '}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
                {request.reviewedAt && (
                  <p>
                    Reviewed:{' '}
                    {new Date(request.reviewedAt).toLocaleDateString()} by{' '}
                    {request.reviewer?.name || 'Unknown'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
