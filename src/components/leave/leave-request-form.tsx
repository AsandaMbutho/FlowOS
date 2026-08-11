'use client';

import { useState } from 'react';
import { useLeaveRequests } from '@/lib/hooks/use-leave-requests';
import { compressImageFile } from '@/lib/image-compression';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

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

export function LeaveRequestForm() {
  const [formData, setFormData] = useState({
    type: 'SICK',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [doctorsNote, setDoctorsNote] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [polishing, setPolishing] = useState(false);

  const { submitRequest, polishReason, loading, error: hookError } =
    useLeaveRequests({
      onSuccess: (message) => {
        setStatus(message);
        setFormData({ type: 'SICK', startDate: '', endDate: '', reason: '' });
        setDoctorsNote(null);
      },
      onError: (error) => {
        setStatus(`Error: ${error.message}`);
      }
    });

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePolish = async () => {
    if (!formData.reason.trim()) return;
    setPolishing(true);
    setStatus('');
    try {
      const polished = await polishReason(formData.reason);
      handleInputChange('reason', polished.trim());
      setStatus('Reason polished with AI!');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to polish reason');
    } finally {
      setPolishing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');

    if (!formData.startDate || !formData.endDate) {
      setStatus('Please select both start and end dates');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setStatus('End date must be after start date');
      return;
    }

    try {
      let doctorsNoteDataUrl: string | undefined;
      let doctorsNoteName: string | undefined;

      if (doctorsNote) {
        if (!doctorsNote.type.startsWith('image/')) {
          setStatus(
            "Only image files (JPG/PNG) are supported for doctor's notes"
          );
          return;
        }
        setStatus('Compressing image...');
        doctorsNoteDataUrl = await compressImageFile(doctorsNote);
        doctorsNoteName = doctorsNote.name;
      }

      await submitRequest(
        formData.type,
        formData.startDate,
        formData.endDate,
        formData.reason,
        doctorsNoteDataUrl,
        doctorsNoteName
      );
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Request Leave</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type of leave</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ANNUAL">Annual leave</option>
              <option value="SICK">Sick leave</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Briefly explain why you're requesting leave"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePolish}
              disabled={polishing || !formData.reason.trim()}
              className="mt-2"
            >
              {polishing ? 'Polishing...' : 'Polish with AI'}
            </Button>
          </div>

          {formData.type === 'SICK' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Doctor's note (image only)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDoctorsNote(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG/PNG images are automatically compressed
              </p>
            </div>
          )}

          {(status || hookError) && (
            <div
              className={`p-3 rounded text-sm ${
                status.startsWith('Error')
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
              }`}
            >
              {status || hookError?.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit request'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
