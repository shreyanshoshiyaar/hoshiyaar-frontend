import React, { useEffect, useMemo, useState } from 'react';
import http from '../../services/apiClient.js';
import curriculumService from '../../services/curriculumService.js';
import {
  CHARACTERS,
  SETTING_KEY,
  findCharacter,
  isNamedCharacter,
  speakerKey,
  loadCharacterImages,
  setCharacterOverrides,
} from '../../utils/characterImages.js';

// Admin → Character Images: replace the picture shown for each character in story, board and
// engagement screens. Only changed characters are stored; the rest keep their default picture.
export default function CharacterImageManager() {
  const [saved, setSaved] = useState({}); // what is stored now
  const [draft, setDraft] = useState({}); // edits not yet saved
  const [uploading, setUploading] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [speakers, setSpeakers] = useState(null); // [{ speaker, name, count }] from lesson content

  useEffect(() => {
    http.get('/api/curriculum/speakers')
      .then((r) => setSpeakers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSpeakers([]));
  }, []);

  // The fixed characters, then one card for every speaker in the lessons who isn't one of them
  // by name (characters added by new chapters), so new chapters show up here on their own.
  const cards = useMemo(() => {
    const list = speakers || [];
    const linesFor = (c) => list.filter((sp) => isNamedCharacter(sp.speaker) && findCharacter(sp.speaker)?.key === c.key)
      .reduce((n, sp) => n + sp.count, 0);
    const fixed = CHARACTERS.map((c) => ({
      key: c.key, name: c.name, image: c.image, lines: speakers ? linesFor(c) : null,
      note: `Used for speakers named: ${c.match.join(', ')}`, isNew: false,
    }));
    const fallback = CHARACTERS.find((c) => c.key === 'arpit_sir');
    const discovered = list.filter((sp) => !isNamedCharacter(sp.speaker) && speakerKey(sp.speaker)).map((sp) => {
      const shared = findCharacter(sp.speaker);
      const shownAs = shared || fallback;
      return {
        key: speakerKey(sp.speaker), name: sp.name, image: shownAs.image, lines: sp.count, isNew: true,
        note: `No picture of their own yet, so students see ${shownAs.name}'s picture`,
      };
    });
    return [...discovered, ...fixed];
  }, [speakers]);

  useEffect(() => {
    loadCharacterImages({ force: true }).then((current) => {
      setSaved(current || {});
      setDraft(current || {});
    });
  }, []);

  const changedCount = useMemo(() => {
    const keys = new Set([...Object.keys(saved), ...Object.keys(draft)]);
    return [...keys].filter((k) => (saved[k] || '') !== (draft[k] || '')).length;
  }, [saved, draft]);

  const setImage = (key, url) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (url && url.trim()) next[key] = url.trim();
      else delete next[key];
      return next;
    });
  };

  const handleUpload = async (key, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', text: 'Choose an image file (PNG, JPG, WebP or SVG).' });
      return;
    }
    setUploading((prev) => ({ ...prev, [key]: true }));
    setStatus({ type: '', text: '' });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hoshiyaar/characters');
      const response = await http.post('/api/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = response.data?.url || response.data?.secure_url;
      if (!url) throw new Error('The upload did not return an image link.');
      setImage(key, url);
    } catch (err) {
      const tooBig = err?.response?.status === 413;
      setStatus({ type: 'error', text: tooBig ? 'That image is too large. Use one under 50 MB.' : `Upload failed: ${err?.response?.data?.message || err.message}` });
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      await curriculumService.updateSetting({
        key: SETTING_KEY,
        value: draft,
        description: 'Character pictures shown in story, board and engagement screens ({ characterKey: imageUrl })',
      });
      setSaved(draft);
      setCharacterOverrides(draft);
      setStatus({ type: 'success', text: 'Saved. Students see the new pictures the next time they open a lesson.' });
    } catch (err) {
      setStatus({ type: 'error', text: `Couldn't save: ${err?.response?.data?.error || err.message}. Try again.` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Character Images</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            The picture shown next to each character's lines in story, board and engagement questions.
            New characters from uploaded chapters appear here on their own, marked "Needs picture".
            Upload a new picture or paste an image link, check the preview, then save. A square image looks best.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {changedCount > 0 && <span className="text-xs font-bold text-amber-700">{changedCount} unsaved change{changedCount > 1 ? 's' : ''}</span>}
          <button
            onClick={() => setDraft(saved)}
            disabled={!changedCount || saving}
            className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={!changedCount || saving}
            className="px-5 py-2 rounded-xl text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {status.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => {
          const current = draft[c.key] || c.image;
          const isCustom = Boolean(draft[c.key]);
          const isChanged = (saved[c.key] || '') !== (draft[c.key] || '');
          const inputId = `char-upload-${c.key}`;
          return (
            <div key={c.key} className={`rounded-2xl border bg-white p-4 flex gap-4 ${isChanged ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'}`}>
              <img
                src={current}
                alt={c.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 bg-slate-50 shrink-0"
                onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900">{c.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${isCustom ? 'bg-indigo-100 text-indigo-700' : c.isNew ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isCustom ? 'Custom' : c.isNew ? 'Needs picture' : 'Default'}
                  </span>
                  {c.lines !== null && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {c.lines ? `${c.lines} line${c.lines > 1 ? 's' : ''} in lessons` : 'Not in any lesson yet'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate" title={c.note}>
                  {isCustom && c.isNew ? 'Uses this picture for every line they speak' : c.note}
                </p>
                <input
                  type="url"
                  id={`char-url-${c.key}`}
                  value={draft[c.key] || ''}
                  onChange={(e) => setImage(c.key, e.target.value)}
                  placeholder="Paste image link, or upload"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <label htmlFor={inputId} className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer ${uploading[c.key] ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                    {uploading[c.key] ? 'Uploading…' : 'Upload picture'}
                  </label>
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading[c.key]}
                    onChange={(e) => { handleUpload(c.key, e.target.files?.[0]); e.target.value = ''; }}
                  />
                  {isCustom && (
                    <button onClick={() => setImage(c.key, '')} className="text-xs font-bold text-slate-500 hover:text-red-600">
                      Reset to default
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
