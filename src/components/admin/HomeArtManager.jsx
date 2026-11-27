import React, { useEffect, useState } from 'react';
import http from '../../services/apiClient.js';
import curriculumService from '../../services/curriculumService.js';

// Admin → Home Pictures: the two-world Home's page background and the Science / Gita card pictures.
// Saved in the "home_art" setting; the app picks them up without an update. Uploads go to Cloudinary server 6.
const KEY = 'home_art';
const FIELDS = [
  {
    key: 'background', label: 'Page background (phones)', size: '1080 × 2340 px, one picture',
    hint: 'Keep a plain colour band across the middle (rows 1170–1638). The top part is pinned to the top of the screen, the bottom part to the bottom.',
    tall: true,
  },
  { key: 'science', label: 'Science card', size: '1200 × 750 px (16:10)', hint: 'Title goes top-left, the button bar along the bottom. No text in the picture.' },
  { key: 'gita', label: 'Gita card', size: '1200 × 750 px (16:10)', hint: 'Title goes top-left, the button bar along the bottom. No text in the picture.' },
  { key: 'backgroundDesktop', label: 'Page background (desktop, optional)', size: '1920 × 1080 px', hint: 'Shown on computers. Leave empty for the soft sky gradient.' },
];

export default function HomeArtManager() {
  const [saved, setSaved] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    curriculumService.getSetting(KEY)
      .then((res) => { const v = res?.data?.value || {}; setSaved(v); setDraft(v); })
      .catch(() => setStatus({ type: 'error', text: "Couldn't load the current pictures." }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const upload = async (k, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus({ type: 'error', text: 'Choose an image file (WebP, PNG or JPG).' }); return; }
    setUploading((u) => ({ ...u, [k]: true }));
    setStatus({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'hoshiyaar/home');
      fd.append('server', '6'); // Cloudinary server 6
      const res = await http.post('/api/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.url || res.data?.secure_url;
      if (!url) throw new Error('The upload did not return an image link.');
      set(k, url);
      setStatus({ type: 'info', text: `Uploaded (${res.data?.width || '?'} × ${res.data?.height || '?'}). Press Save to use it.` });
    } catch (err) {
      setStatus({ type: 'error', text: `Upload failed: ${err?.response?.data?.message || err.message}` });
    } finally {
      setUploading((u) => ({ ...u, [k]: false }));
    }
  };

  const save = async () => {
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const value = {};
      for (const f of FIELDS) { const u = String(draft[f.key] || '').trim(); if (u) value[f.key] = u; }
      const color = String(draft.bgColor || '').trim();
      if (color) {
        if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Middle colour must look like #E7EFFC');
        value.bgColor = color;
      }
      await curriculumService.updateSetting({ key: KEY, value, description: 'Home pictures: page background (1080x2340, plain middle band), bgColor, Science and Gita cards (1200x750)' });
      setSaved(value);
      setDraft(value);
      setStatus({ type: 'success', text: 'Saved. Students see the new pictures the next time Home opens.' });
    } catch (err) {
      setStatus({ type: 'error', text: `Couldn't save: ${err?.response?.data?.error || err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const changed = JSON.stringify(saved) !== JSON.stringify(draft);
  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Home Pictures</h2>
          <p className="text-sm text-slate-500">The Home page background and the Science / Gita card pictures. Uploads go to Cloudinary server 6. No app update needed.</p>
        </div>
        <button type="button" onClick={save} disabled={saving || !changed} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40">
          {saving ? 'Saving…' : changed ? 'Save' : 'Saved'}
        </button>
      </div>

      {status.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${status.type === 'error' ? 'bg-red-50 text-red-700' : status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>{status.text}</div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {FIELDS.map((f) => {
          const url = draft[f.key] || '';
          const id = `home-art-${f.key}`;
          return (
            <div key={f.key} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-black text-slate-800">{f.label}</p>
                <p className="text-xs font-bold text-slate-400">{f.size}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{f.hint}</p>
              <div className={`mt-3 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center ${f.tall ? 'h-72' : 'aspect-[16/10]'}`}>
                {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : <span className="text-xs font-bold text-slate-400">Built-in picture in use</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={url} onChange={(e) => set(f.key, e.target.value)} placeholder="Paste image link, or upload" className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs" />
                <label htmlFor={id} className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer ${uploading[f.key] ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                  {uploading[f.key] ? 'Uploading…' : 'Upload'}
                </label>
                <input id={id} type="file" accept="image/*" className="hidden" disabled={uploading[f.key]} onChange={(e) => { upload(f.key, e.target.files?.[0]); e.target.value = ''; }} />
                {url && <button type="button" onClick={() => set(f.key, '')} className="shrink-0 text-xs font-bold px-2 text-slate-500 hover:text-red-600">Clear</button>}
              </div>
            </div>
          );
        })}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="font-black text-slate-800">Middle colour</p>
          <p className="mt-1 text-xs text-slate-500">The plain colour in the middle band of the page background. It fills the space on tall phones, so it should match the band exactly.</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg border border-slate-200" style={{ background: /^#[0-9a-f]{6}$/i.test(draft.bgColor || '') ? draft.bgColor : '#E8F3FF' }} />
            <input value={draft.bgColor || ''} onChange={(e) => set('bgColor', e.target.value.trim())} placeholder="#E7EFFC" className="w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono" />
          </div>
        </div>
      </div>
    </div>
  );
}
