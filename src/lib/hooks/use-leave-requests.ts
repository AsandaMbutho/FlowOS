import { useCallback, useState } from "react";

export interface LeaveRequest {
  id: string;
  type: "ANNUAL" | "SICK" | "PERSONAL";
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  doctorsNoteDataUrl?: string;
  doctorsNoteName?: string;
  managerNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  user?: { name?: string; email?: string };
  reviewer?: { name?: string; email?: string };
}

export interface UseLeaveRequestsOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

/**
 * Hook for managing leave requests
 */
export function useLeaveRequests(options?: UseLeaveRequestsOptions) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leave/submit");
      if (!response.ok) throw new Error("Failed to fetch leave requests");
      const data = await response.json();
      setLeaveRequests(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const submitRequest = useCallback(
    async (
      type: string,
      startDate: string,
      endDate: string,
      reason: string,
      doctorsNoteDataUrl?: string,
      doctorsNoteName?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/leave/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            startDate,
            endDate,
            reason,
            doctorsNoteDataUrl,
            doctorsNoteName,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to submit request");
        }

        const newRequest = await response.json();
        setLeaveRequests((prev) => [newRequest, ...prev]);
        options?.onSuccess?.("Leave request submitted successfully");
        return newRequest;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const polishReason = useCallback(async (rawText: string) => {
    try {
      const response = await fetch("/api/leave/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) {
        throw new Error("Failed to polish reason");
      }

      const data = await response.json();
      return data.polished;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      throw error;
    }
  }, []);

  return {
    leaveRequests,
    loading,
    error,
    fetchMyRequests,
    submitRequest,
    polishReason
  };
}

/**
 * Hook for managing pending leave requests (admin/manager)
 */
export function usePendingLeaveRequests(options?: UseLeaveRequestsOptions) {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leave/decide");
      if (!response.ok) throw new Error("Failed to fetch pending requests");
      const data = await response.json();
      setPendingRequests(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const decideRequest = useCallback(
    async (leaveRequestId: string, status: "APPROVED" | "REJECTED") => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/leave/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaveRequestId, status }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to decide request");
        }

        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== leaveRequestId)
        );
        options?.onSuccess?.(
          `Leave request ${status.toLowerCase()} successfully`,
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    pendingRequests,
    loading,
    error,
    fetchPendingRequests,
    decideRequest,
  };
}
