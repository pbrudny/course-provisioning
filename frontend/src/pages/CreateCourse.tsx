import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, type CourseType, type LabGroupInput } from '../api/client';
import { LabGroupFields } from '../components/LabGroupFields';

const COURSES = [
  { slug: 'oop', label: 'Object Oriented Programming' },
  { slug: 'edp', label: 'Event Driven Programming' },
];

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_CHANNELS = ['announcements', 'general', 'lectures', 'qa-help'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['8:00-9:40', '9:50-11:30', '11:40-13:20', '13:30-15:10'];

export function CreateCourse() {
  const navigate = useNavigate();

  // --- course selection ---
  const [courseSlug, setCourseSlug] = useState(COURSES[0].slug);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');
  const [type, setType] = useState<CourseType>('LECTURE');

  const selectedCourse = COURSES.find((c) => c.slug === courseSlug) ?? COURSES[0];
  const repoBase = `${courseSlug}-${season}-${year}`;
  const semester = `${season}-${year}`;

  // --- discord ---
  const [discordGuildId, setDiscordGuildId] = useState('');

  // --- schedule ---
  const [lectureCount, setLectureCount] = useState<number | ''>('');
  const [labCount, setLabCount] = useState<number | ''>('');
  const [lectureRoom, setLectureRoom] = useState('');
  const [lectureDay, setLectureDay] = useState('');
  const [lectureTime, setLectureTime] = useState('');

  // --- resource names ---
  const [githubRepoName, setGithubRepoName] = useState(repoBase);
  const [discordChannels, setDiscordChannels] = useState<string[]>([...DEFAULT_CHANNELS]);
  const [labGroups, setLabGroups] = useState<LabGroupInput[]>([
    { name: '', number: 1, githubRepoName: `${repoBase}-group-1`, discordChannelName: 'lab-group-1', discordRoleName: 'Lab Group 1' },
  ]);

  // When repoBase changes, update lecture repo + lab group repos if still auto-generated
  const lastRepoBase = useRef(repoBase);
  useEffect(() => {
    const prev = lastRepoBase.current;
    if (githubRepoName === prev || githubRepoName === '') {
      setGithubRepoName(repoBase);
    }
    setLabGroups((gs) =>
      gs.map((g) => {
        const wasAuto = !g.githubRepoName || g.githubRepoName === `${prev}-group-${g.number}`;
        return wasAuto ? { ...g, githubRepoName: `${repoBase}-group-${g.number}` } : g;
      }),
    );
    lastRepoBase.current = repoBase;
  }, [repoBase]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- form state ---
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChannel = () => setDiscordChannels((prev) => [...prev, '']);
  const removeChannel = (i: number) => setDiscordChannels((prev) => prev.filter((_, idx) => idx !== i));
  const updateChannel = (i: number, val: string) =>
    setDiscordChannels((prev) => prev.map((c, idx) => (idx === i ? val : c)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (type === 'LABORATORY' && labGroups.length === 0) {
      setError('Laboratory courses require at least one lab group.');
      return;
    }
    if (type === 'LABORATORY' && labGroups.some((g) => !g.name.trim())) {
      setError('All lab groups must have a name.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createCourse({
        name: selectedCourse.label,
        semester,
        type,
        discordGuildId: discordGuildId.trim(),
        githubRepoName: type === 'LECTURE' && githubRepoName.trim() ? githubRepoName.trim() : undefined,
        discordChannels: type === 'LECTURE' ? discordChannels.filter((c) => c.trim()) : undefined,
        labGroups: type === 'LABORATORY' ? labGroups : undefined,
        lectureCount: lectureCount !== '' ? lectureCount : undefined,
        labCount: labCount !== '' ? labCount : undefined,
        lectureRoom: lectureRoom.trim() || undefined,
        lectureDay: lectureDay || undefined,
        lectureTime: lectureTime || undefined,
      });
      navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const smallInputClass =
    'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
          <h1 className="text-xl font-bold text-gray-900">New Course</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Main info card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Course */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                className={inputClass}
              >
                {COURSES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Discord Guild ID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Discord Server ID <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 1016285396189052991"
                value={discordGuildId}
                onChange={(e) => setDiscordGuildId(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Enable Developer Mode in Discord → right-click your server → Copy Server ID
              </p>
            </div>

            {/* Year + Season */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  min={2020}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || CURRENT_YEAR)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Semester</label>
                <div className="flex gap-4 pt-2.5">
                  {(['summer', 'winter'] as const).map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="season"
                        value={s}
                        checked={season === s}
                        onChange={() => setSeason(s)}
                        className="accent-indigo-600"
                      />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Slug preview */}
            <p className="text-xs text-gray-400">
              Repo base: <span className="font-mono text-gray-600">{repoBase}</span>
            </p>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Course type</label>
              <div className="flex gap-4">
                {(['LECTURE', 'LABORATORY'] as CourseType[]).map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={type === t}
                      onChange={() => {
                        setType(t);
                        if (t === 'LABORATORY' && labGroups.length === 0) {
                          setLabGroups([{ name: '', number: 1, githubRepoName: `${repoBase}-group-1`, discordChannelName: 'lab-group-1', discordRoleName: 'Lab Group 1' }]);
                        }
                      }}
                      className="accent-indigo-600"
                    />
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            {type === 'LABORATORY' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Lab groups <span className="text-red-500">*</span>
                </label>
                <LabGroupFields
                  groups={labGroups}
                  onChange={setLabGroups}
                  repoBase={repoBase}
                />
              </div>
            )}
          </div>

          {/* Schedule card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Schedule</h2>

            {/* Class counts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Lectures per semester</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  placeholder="e.g. 14"
                  value={lectureCount}
                  onChange={(e) => setLectureCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className={inputClass}
                />
              </div>
              {type === 'LABORATORY' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Labs per semester</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    placeholder="e.g. 13"
                    value={labCount}
                    onChange={(e) => setLabCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Lecture schedule */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Lecture slot</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Room</label>
                  <input
                    type="text"
                    placeholder="e.g. 14B"
                    value={lectureRoom}
                    onChange={(e) => setLectureRoom(e.target.value)}
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Day</label>
                  <select
                    value={lectureDay}
                    onChange={(e) => setLectureDay(e.target.value)}
                    className={smallInputClass}
                  >
                    <option value="">— select —</option>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Time</label>
                  <select
                    value={lectureTime}
                    onChange={(e) => setLectureTime(e.target.value)}
                    className={smallInputClass}
                  >
                    <option value="">— select —</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resource names card — lecture only */}
          {type === 'LECTURE' && (
            <div className="rounded-lg border border-indigo-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Resource names
                <span className="ml-2 text-xs font-normal text-gray-400">edit before provisioning</span>
              </h2>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">GitHub repository</label>
                <input
                  type="text"
                  value={githubRepoName}
                  onChange={(e) => setGithubRepoName(e.target.value)}
                  className={smallInputClass}
                  placeholder="auto-generated"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Discord channels</label>
                <div className="space-y-1.5">
                  {discordChannels.map((ch, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={ch}
                        onChange={(e) => updateChannel(i, e.target.value)}
                        className={smallInputClass}
                        placeholder="channel-name"
                      />
                      <button
                        type="button"
                        onClick={() => removeChannel(i)}
                        className="rounded px-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove channel"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addChannel}
                    className="flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                  >
                    + Add channel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {submitting ? 'Creating…' : 'Create course'}
            </button>
            <Link
              to="/"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
