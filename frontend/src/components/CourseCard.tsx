import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Course, type ProvisioningStep } from '../api/client';
import { StatusBadge } from './StatusBadge';

interface Props {
  course: Course;
  onRetry: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const stepLabel = (name: string) =>
  name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const stepIcon: Record<string, string> = {
  COMPLETED: '✓',
  FAILED: '✗',
  IN_PROGRESS: '…',
  PENDING: '○',
};

const stepColour: Record<string, string> = {
  COMPLETED: 'text-green-600',
  FAILED: 'text-red-600',
  IN_PROGRESS: 'text-blue-600',
  PENDING: 'text-gray-400',
};

const SHOW_STEPS_FOR = new Set(['FAILED', 'RETRYING', 'IN_PROGRESS']);

export function CourseCard({ course, onRetry, onDelete }: Props) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProvisioningStep[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!SHOW_STEPS_FOR.has(course.status)) {
      setSteps(null);
      return;
    }
    api.getCourseStatus(course.id).then((s) => setSteps(s.steps)).catch(() => null);
  }, [course.id, course.status]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(course.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      await onRetry(course.id);
    } catch (e: unknown) {
      setRetryError(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/courses/${course.id}`}
            className="block truncate text-base font-semibold text-gray-900 hover:text-indigo-600"
          >
            {course.name}
          </Link>
          <p className="mt-0.5 text-sm text-gray-500">{course.semester}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={course.status} />
          {course.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {retrying ? 'Retrying…' : 'Retry'}
            </button>
          )}
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md border border-red-400 bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-400 hover:border-red-300 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {retryError && (
        <p className="mt-2 text-xs text-red-600">{retryError}</p>
      )}

      {/* Provisioning steps */}
      {steps && steps.length > 0 && (
        <ol className="mt-4 space-y-1.5 border-t border-gray-100 pt-3">
          {steps.map((step) => (
            <li key={step.stepName} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={`w-4 text-center text-sm font-bold ${stepColour[step.status]}`}>
                  {stepIcon[step.status]}
                </span>
                <span className={`text-xs font-medium ${stepColour[step.status]}`}>
                  {stepLabel(step.stepName)}
                </span>
                {step.attempts > 1 && (
                  <span className="ml-auto text-xs text-gray-400">{step.attempts} attempts</span>
                )}
              </div>
              {step.errorMsg && step.status === 'FAILED' && (
                <p className="ml-6 text-xs text-red-500">{step.errorMsg}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* GitHub repo links on COMPLETED */}
      {course.status === 'COMPLETED' && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
          {course.githubRepoUrl && (
            <a
              href={course.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {course.githubRepoUrl.replace('https://github.com/', '')}
            </a>
          )}
          {course.labGroups && course.labGroups.some((g) => g.githubRepoUrl) && (
            <div className="space-y-0.5">
              {course.labGroups.filter((g) => g.githubRepoUrl).map((g) => (
                <a
                  key={g.id}
                  href={g.githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Group {g.number}: {g.githubRepoUrl!.replace('https://github.com/', '')}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer row */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{course.type}</span>
        {course.labGroups && course.labGroups.length > 0 && (
          <span>{course.labGroups.length} lab group{course.labGroups.length !== 1 ? 's' : ''}</span>
        )}
        <span className="ml-auto">{new Date(course.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
