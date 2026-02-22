import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Course } from '../api/client';
import { CourseCard } from '../components/CourseCard';

export function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .listCourses()
      .then(setCourses)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load courses'))
      .finally(() => setLoading(false));
  };

  const handleRetry = async (id: string) => {
    await api.retryCourse(id);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.deleteCourse(id);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Course Provisioning</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/templates"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Templates
            </Link>
            <Link
              to="/new"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              + New Course
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {loading && (
          <p className="text-center text-sm text-gray-500">Loading courses…</p>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button onClick={load} className="ml-3 underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-sm text-gray-500">No courses yet.</p>
            <Link to="/new" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Create your first course →
            </Link>
          </div>
        )}

        {courses.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
              <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600">
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} onRetry={handleRetry} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
