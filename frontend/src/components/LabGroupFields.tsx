import type { LabGroupInput } from '../api/client';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['8:00-9:40', '9:50-11:30', '11:40-13:20', '13:30-15:10'];

interface Props {
  groups: LabGroupInput[];
  onChange: (groups: LabGroupInput[]) => void;
  repoBase: string;
}

const suggestGroupRepo = (base: string, n: number) => (base ? `${base}-group-${n}` : '');
const suggestGroupChannel = (n: number) => `lab-group-${n}`;
const suggestGroupRole = (n: number, groupName: string) =>
  groupName ? `Lab Group ${n} — ${groupName}` : `Lab Group ${n}`;

export function LabGroupFields({ groups, onChange, repoBase }: Props) {
  const add = () => {
    const nextNumber = groups.length > 0 ? Math.max(...groups.map((g) => g.number)) + 1 : 1;
    onChange([
      ...groups,
      {
        name: '',
        number: nextNumber,
        githubRepoName: suggestGroupRepo(repoBase, nextNumber),
        discordChannelName: suggestGroupChannel(nextNumber),
        discordRoleName: suggestGroupRole(nextNumber, ''),
      },
    ]);
  };

  const remove = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const updateCore = (index: number, field: 'name' | 'number', value: string | number) => {
    const updated = groups.map((g, i) => {
      if (i !== index) return g;
      const next = { ...g, [field]: value };

      const newN = field === 'number' ? (value as number) : g.number;
      const newGroupName = field === 'name' ? (value as string) : g.name;

      if (g.githubRepoName === suggestGroupRepo(repoBase, g.number) || !g.githubRepoName) {
        next.githubRepoName = suggestGroupRepo(repoBase, newN);
      }
      if (g.discordChannelName === suggestGroupChannel(g.number) || !g.discordChannelName) {
        next.discordChannelName = suggestGroupChannel(newN);
      }
      if (g.discordRoleName === suggestGroupRole(g.number, g.name) || !g.discordRoleName) {
        next.discordRoleName = suggestGroupRole(newN, newGroupName);
      }

      return next;
    });
    onChange(updated);
  };

  const updateName = (index: number, field: 'githubRepoName' | 'discordChannelName' | 'discordRoleName', value: string) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const updateSchedule = (index: number, field: 'room' | 'day' | 'time', value: string) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const inputClass = 'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'mb-1 block text-xs font-medium text-gray-500';

  return (
    <div className="space-y-4">
      {groups.map((group, i) => (
        <div key={i} className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-3">
          {/* Number + Name row */}
          <div className="flex gap-2">
            <div className="w-20 flex-shrink-0">
              <label className={labelClass}>No.</label>
              <input
                type="number"
                min={1}
                value={group.number}
                onChange={(e) => updateCore(i, 'number', parseInt(e.target.value, 10) || 1)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Name</label>
              <input
                type="text"
                placeholder="e.g. Lab Group A"
                value={group.name}
                onChange={(e) => updateCore(i, 'name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex items-end pb-1.5">
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove group"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Resource names */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className={labelClass}>GitHub repo</label>
              <input
                type="text"
                value={group.githubRepoName ?? ''}
                onChange={(e) => updateName(i, 'githubRepoName', e.target.value)}
                className={inputClass}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <label className={labelClass}>Discord channel</label>
              <input
                type="text"
                value={group.discordChannelName ?? ''}
                onChange={(e) => updateName(i, 'discordChannelName', e.target.value)}
                className={inputClass}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <label className={labelClass}>Discord role</label>
              <input
                type="text"
                value={group.discordRoleName ?? ''}
                onChange={(e) => updateName(i, 'discordRoleName', e.target.value)}
                className={inputClass}
                placeholder="auto-generated"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass}>Room</label>
              <input
                type="text"
                placeholder="e.g. 14B"
                value={group.room ?? ''}
                onChange={(e) => updateSchedule(i, 'room', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Day</label>
              <select
                value={group.day ?? ''}
                onChange={(e) => updateSchedule(i, 'day', e.target.value)}
                className={inputClass}
              >
                <option value="">— select —</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <select
                value={group.time ?? ''}
                onChange={(e) => updateSchedule(i, 'time', e.target.value)}
                className={inputClass}
              >
                <option value="">— select —</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="mt-1 flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        + Add lab group
      </button>
    </div>
  );
}
