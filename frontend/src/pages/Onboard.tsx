import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { onboardingApi, type OnboardingCourse } from '../api/client';

export function Onboard() {
  const { token } = useParams<{ token: string }>();

  const [course, setCourse] = useState<OnboardingCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    onboardingApi
      .getCourse(token)
      .then(setCourse)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Link not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError(null);
    if (!email.trim()) { setFormError('Email is required'); return; }
    if (!studentNumber.trim()) { setFormError('Student number is required'); return; }
    setSubmitting(true);
    try {
      await onboardingApi.register(token, { email: email.trim(), studentNumber: studentNumber.trim() });
      setSubmitted(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
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
        <p className="text-sm text-red-600">{error ?? 'Invalid onboarding link'}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-green-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-4xl">📧</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-gray-600">
            We've sent a verification link to <strong>{email}</strong>. Click it to continue your registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{course.semester} — Student Registration</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Step 1 of 2 — Verify your identity</h2>

          {formError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                University email *
              </label>
              <input
                type="email"
                placeholder="firstname.lastname@akademiata.edu.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Student number *
              </label>
              <input
                type="text"
                placeholder="e.g. 35656"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send verification email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
