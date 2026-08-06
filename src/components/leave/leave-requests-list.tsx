'use client';

import { useEffect } from 'react';
import { useLeaveRequests, LeaveRequest } from '@/lib/hooks/use-leave-requests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TYPE_LABELS = {
  SICK: 'Sick leave',
  VACATION: 'Vacation',
  PERSONAL: 'Personal',
  OTHER: 'Other'
};

const STATUS_LABELS = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  DENIED: 'Denied'
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  DENIED: 'bg-red-100 text-red-800'
};

export function LeaveRequestsList() {
  const { leaveRequests, loading, fetchMyRequests } = useLeaveRequests();

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  if (loading && leaveRequests.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading your leave requests...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Your Leave Requests</h3>
      
      {leaveRequests.length === 0 ? (
        <p className="text-gray-500 text-sm">No leave requests yet</p>
      ) : (
        <div className="space-y-3">
          {leaveRequests.map((request: LeaveRequest) => (
            <div
              key={request.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">
                    {TYPE_LABELS[request.type as keyof typeof TYPE_LABELS]}
                  </p>
                  <p className="text-sm text-gray-600">
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
                <p className="text-sm text-gray-700 mb-2">
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

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <p>
                  Submitted:{' '}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
                {request.decidedAt && (
                  <p>
                    Decided:{' '}
                    {new Date(request.decidedAt).toLocaleDateString()} by{' '}
                    {request.approvedByUser?.name || 'Unknown'}
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
