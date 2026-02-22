import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type SeedTemplate } from '../api/client';

type EditorState =
  | { mode: 'none' }
  | { mode: 'create' }
  | { mode: 'edit'; template: SeedTemplate };

const emptyForm = { label: '', description: '', readme: '' };

export function Templates() {
  const [templates, setTemplates] = useState<SeedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ mode: 'none' });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .listTemplates()
      .then(setTemplates)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setSaveError(null);
    setEditor({ mode: 'create' });
  };

  const openEdit = (t: SeedTemplate) => {
    setForm({ label: t.label, description: t.description ?? '', readme: t.readme });
    setSaveError(null);
    setEditor({ mode: 'edit', template: t });
  };

  const closeEditor = () => setEditor({ mode: 'none' });

  const handleSave = async () => {
    setSaveError(null);
    if (!form.label.trim()) { setSaveError('Label is required'); return; }
    if (!form.readme.trim()) { setSaveError('README content is required'); return; }

    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        description: form.description.trim() || undefined,
        readme: form.readme,
      };
      if (editor.mode === 'create') {
        await api.createTemplate(body);
      } else if (editor.mode === 'edit') {
        await api.updateTemplate(editor.template.id, body);
      }
      setEditor({ mode: 'none' });
      load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTemplate(id);
      setConfirmDelete(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-900">Seed Templates</h1>
          {editor.mode === 'none' && (
            <button
              onClick={openCreate}
              className="ml-auto rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + New template
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Editor panel */}
        {editor.mode !== 'none' && (
          <div className="rounded-lg border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              {editor.mode === 'create' ? 'New template' : `Edit — ${editor.template.label}`}
            </h2>

            {saveError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Label *</label>
              <input
                type="text"
                placeholder="e.g. Event Driven Programming"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <input
                type="text"
                placeholder="Short description shown in template picker"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">README.md content *</label>
              <textarea
                rows={20}
                placeholder="# Course Title&#10;&#10;Your Markdown content here…"
                value={form.readme}
                onChange={(e) => setForm((f) => ({ ...f, readme: e.target.value }))}
                className={`${inputClass} font-mono text-xs leading-relaxed`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={closeEditor}
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                      {t.isSystem && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">system</span>
                      )}
                    </div>
                    {t.description && (
                      <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
                    )}
                    <pre className="mt-3 max-h-40 overflow-y-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed border border-gray-100">
                      {t.readme}
                    </pre>
                  </div>

                  <div className="flex flex-shrink-0 flex-col gap-2 pt-0.5">
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    {!t.isSystem && (
                      confirmDelete === t.id ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="rounded px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(t.id)}
                          className="rounded px-3 py-1 text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
