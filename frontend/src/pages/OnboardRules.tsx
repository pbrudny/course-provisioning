import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { onboardingApi } from '../api/client';

const RULES = [
  'You must attend at least 80% of all classes.',
  'You must pass the 1-on-1 oral exam.',
  'You must pass the entry test at the start of each laboratory class.',
];

export function OnboardRules() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const studentId = searchParams.get('student') ?? '';

  const [currentRule, setCurrentRule] = useState(0);
  const [agreeing, setAgreeing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    if (!studentId) return;
    setAgreeing(true);
    setError(null);
    try {
      await onboardingApi.agreeRule(studentId, currentRule);
      if (currentRule >= RULES.length - 1) {
        navigate(`/onboard/${token}/done?student=${studentId}`);
      } else {
        setCurrentRule((n) => n + 1);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record agreement');
    } finally {
      setAgreeing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Step 2 of 2 — Course rules
          </p>
          <h1 className="mt-2 text-xl font-bold text-gray-900">
            Rule {currentRule + 1} of {RULES.length}
          </h1>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {RULES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < currentRule
                  ? 'w-6 bg-green-500'
                  : i === currentRule
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="rounded-xl border border-indigo-100 bg-white p-8 shadow-sm text-center">
          <p className="text-lg font-medium text-gray-900 leading-relaxed">
            {RULES[currentRule]}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <button
          onClick={() => { void handleAgree(); }}
          disabled={agreeing}
          className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {agreeing ? 'Saving…' : 'I Agreed'}
        </button>
      </div>
    </div>
  );
}
