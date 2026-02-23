import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { onboardingApi } from '../api/client';

export function OnboardVerify() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verificationToken = searchParams.get('v');
    if (!verificationToken) {
      setError('Missing verification token');
      return;
    }

    onboardingApi
      .verify(verificationToken)
      .then(({ studentId, onboardingToken }) => {
        navigate(`/onboard/${onboardingToken}/rules?student=${studentId}`, { replace: true });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Verification failed');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          {token && (
            <Link
              to={`/onboard/${token}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              ← Back to registration
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Verifying your email…</p>
    </div>
  );
}
