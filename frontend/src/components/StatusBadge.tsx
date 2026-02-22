import type { CourseStatus } from '../api/client';

const colours: Record<CourseStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROVISIONING: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  RETRYING: 'bg-yellow-100 text-yellow-700',
};

export function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
