import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, type Course, type ProvisioningStep, type SeedTemplate } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

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

const GitHubIcon = () => (
  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [steps, setSteps] = useState<ProvisioningStep[]>([]);
  const [templates, setTemplates] = useState<SeedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([api.getCourse(id), api.getCourseStatus(id)])
      .then(([c, s]) => {
        setCourse(c);
        setSteps(s.steps);
        setSelectedTemplate(c.seedTemplateId ?? null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    api.listTemplates().then(setTemplates).catch(() => {});
  }, []);

  const handleSaveTemplate = async (templateId: string) => {
    if (!id) return;
    setSelectedTemplate(templateId);
    setSavingTemplate(true);
    try {
      const updated = await api.updateCourse(id, { seedTemplateId: templateId });
      setCourse(updated);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    setProvisioning(true);
    try {
      await api.startProvisioning(id);
      load();
    } finally {
      setProvisioning(false);
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    try {
      await api.retryCourse(id);
      load();
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteCourse(id);
      navigate('/');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error ?? 'Course not found'}</p>
          <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">← Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">{course.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">

        {/* Overview */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">{course.name}</p>
              <p className="text-sm text-gray-500">{course.semester}</p>
            </div>
            <StatusBadge status={course.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-800">{course.type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium text-gray-800">{new Date(course.createdAt).toLocaleString()}</dd>
            </div>
            {course.lectureCount != null && (
              <div>
                <dt className="text-gray-500">Lectures / semester</dt>
                <dd className="font-medium text-gray-800">{course.lectureCount}</dd>
              </div>
            )}
            {course.labCount != null && (
              <div>
                <dt className="text-gray-500">Labs / semester</dt>
                <dd className="font-medium text-gray-800">{course.labCount}</dd>
              </div>
            )}
          </dl>

          {/* Lecture schedule */}
          {(course.lectureRoom || course.lectureDay || course.lectureTime) && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Lecture schedule</p>
              <p className="text-sm text-gray-800">
                {[course.lectureDay, course.lectureTime, course.lectureRoom && `Room ${course.lectureRoom}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          )}

          {/* GitHub links */}
          {course.githubRepoUrl && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">GitHub</p>
              <a
                href={course.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <GitHubIcon />
                {course.githubRepoUrl.replace('https://github.com/', '')}
              </a>
            </div>
          )}
          {course.labGroups && course.labGroups.some((g) => g.githubRepoUrl) && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">GitHub — Lab Groups</p>
              <div className="space-y-1">
                {course.labGroups.filter((g) => g.githubRepoUrl).map((g) => (
                  <a
                    key={g.id}
                    href={g.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <GitHubIcon />
                    Group {g.number}: {g.githubRepoUrl!.replace('https://github.com/', '')}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lab groups */}
        {course.labGroups && course.labGroups.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Lab Groups</h2>
            <ul className="divide-y divide-gray-100">
              {course.labGroups.map((g) => (
                <li key={g.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">
                      <span className="font-medium">Group {g.number}</span>
                      {g.name && <span className="ml-2 text-gray-500">— {g.name}</span>}
                    </span>
                    {g.githubRepoUrl && (
                      <a
                        href={g.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                  {(g.day || g.time || g.room) && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {[g.day, g.time, g.room && `Room ${g.room}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Seed template picker — only while PENDING */}
        {course.status === 'PENDING' && (
          <div className="rounded-lg border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">GitHub README Template</h2>
              {savingTemplate && <span className="text-xs text-gray-400">Saving…</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {templates.map((t) => {
                const active = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSaveTemplate(t.id)}
                    disabled={savingTemplate}
                    className={`rounded-lg border-2 p-3 text-left transition-colors disabled:opacity-50 ${
                      active
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className={`text-sm font-medium ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {t.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Provisioning steps */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Provisioning Steps</h2>
          {steps.length === 0 ? (
            <p className="text-sm text-gray-400">No steps recorded.</p>
          ) : (
            <ol className="space-y-2">
              {steps.map((step) => (
                <li key={step.stepName} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 text-center text-sm font-bold ${stepColour[step.status]}`}>
                      {stepIcon[step.status]}
                    </span>
                    <span className={`text-sm font-medium ${stepColour[step.status]}`}>
                      {stepLabel(step.stepName)}
                    </span>
                    {step.attempts > 1 && (
                      <span className="ml-auto text-xs text-gray-400">{step.attempts} attempts</span>
                    )}
                    {step.finishedAt && (
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(step.finishedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {step.errorMsg && (
                    <p className="ml-6 text-xs text-red-500">{step.errorMsg}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {course.status === 'PENDING' && (
            <button
              onClick={handleStart}
              disabled={provisioning}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {provisioning ? 'Starting…' : 'Start Provisioning'}
            </button>
          )}
          {course.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {retrying ? 'Retrying…' : 'Retry Provisioning'}
            </button>
          )}
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:border-red-300 hover:text-red-600"
            >
              Delete Course
            </button>
          )}
        </div>

      </main>
    </div>
  );
}
