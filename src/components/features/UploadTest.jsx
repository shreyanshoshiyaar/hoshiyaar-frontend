import React, { useState } from 'react';
import heroPoint from '../../assets/images/imageUpload.png';

// API base URL configuration - same logic as other services
const isLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
const API_BASE = isLocalhost ? '' : (import.meta.env.VITE_API_BASE || '');

export default function UploadTest() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [publicId, setPublicId] = useState('');
  const [itemId, setItemId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'success', text: '', hideAt: 0 });
  const [uploadedImages, setUploadedImages] = useState([]); // for multi
  const [maxCount, setMaxCount] = useState(5);

  // Curriculum selection state
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState('CBSE');
  const [classes, setClasses] = useState([]);
  const [classTitle, setClassTitle] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('Science');
  const [chapters, setChapters] = useState([]);
  const [units, setUnits] = useState([]);
  const [modules, setModules] = useState([]);
  const [items, setItems] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [moduleId, setModuleId] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    if (!file && files.length === 0) return;
    try {
      setLoading(true);
      const form = new FormData();
      const many = files.length > 0;
      if (many) {
        files.slice(0, maxCount).forEach(f => form.append('files', f));
      } else if (file) {
        form.append('file', file);
      }
      form.append('folder', 'hoshiyaar-test');
      const res = await fetch(`${API_BASE}${many ? '/api/upload/images' : '/api/upload/image'}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload failed');
      if (data.images) {
        const toDisplay = (data.images || []).map((img, idx) => ({
          ...img,
          name: (files[idx] && files[idx].name) || (() => {
            try { return decodeURIComponent((img.url || '').split('/').pop() || ''); } catch { return (img.public_id || '').split('/').pop(); }
          })()
        }));
        setUrl('');
        setPublicId('');
        setUploadedImages(toDisplay);
        setToast({ open: true, type: 'success', text: `Uploaded ${data.images.length} images!`, hideAt: Date.now() + 2000 });
      } else {
        setUrl(data.secure_url || data.url);
        setPublicId(data.public_id || data.publicId || '');
        setToast({ open: true, type: 'success', text: 'Uploaded successfully!', hideAt: Date.now() + 2000 });
      }
    } catch (err) {
      setError(err.message);
      setToast({ open: true, type: 'error', text: err.message || 'Upload failed', hideAt: Date.now() + 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDb = async () => {
    try {
      setError('');
      if (!itemId) throw new Error('Enter CurriculumItem ID');
      const chosenUrl = manualUrl || url;
      if (!chosenUrl && uploadedImages.length === 0) throw new Error('Provide an image URL or upload one');
      const body = uploadedImages.length > 0
        ? { images: uploadedImages.map(i => i.url), imagePublicIds: uploadedImages.map(i => i.public_id), append: true }
        : { images: [chosenUrl], append: true };
      if (publicId) body.imagePublicIds = [publicId];
      const resp = await fetch(`${API_BASE}/api/curriculum/items/${itemId}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Save failed');
      setToast({ open: true, type: 'success', text: 'Saved to DB!', hideAt: Date.now() + 2000 });
      // clear staged uploads after successful save
      setUploadedImages([]);
    } catch (e) {
      setError(e.message);
      setToast({ open: true, type: 'error', text: e.message || 'Save failed', hideAt: Date.now() + 2000 });
    }
  };

  const handleRemoveAllFromDb = async () => {
    try {
      setError('');
      if (!itemId) throw new Error('Select CurriculumItem');
      if (!window.confirm('Remove all images from this item?')) return;
      const resp = await fetch(`${API_BASE}/api/curriculum/items/${itemId}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [], imagePublicIds: [], append: false })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Remove failed');
      setToast({ open: true, type: 'success', text: 'Removed all images!', hideAt: Date.now() + 2000 });
    } catch (e) {
      setError(e.message);
      setToast({ open: true, type: 'error', text: e.message || 'Remove failed', hideAt: Date.now() + 2000 });
    }
  };

  // Load boards on mount
  React.useEffect(() => {
    (async () => {
      try {
        const b = await fetch(`${API_BASE}/api/curriculum/boards`).then(r=>r.json());
        setBoards(Array.isArray(b) ? b : []);
      } catch (_) {}
    })();
  }, []);

  // Load classes for board
  React.useEffect(() => {
    (async () => {
      try {
        const c = await fetch(`${API_BASE}/api/curriculum/classes?board=${encodeURIComponent(board)}`).then(r=>r.json());
        setClasses(Array.isArray(c) ? c : []);
      } catch (_) { setClasses([]); }
    })();
  }, [board]);

  // Load subjects for board(+class)
  React.useEffect(() => {
    (async () => {
      try {
        const url = `${API_BASE}/api/curriculum/subjects?board=${encodeURIComponent(board)}${classTitle ? `&classTitle=${encodeURIComponent(classTitle)}` : ''}`;
        const s = await fetch(url).then(r=>r.json());
        setSubjects(Array.isArray(s) ? s : []);
      } catch (_) { setSubjects([]); }
    })();
  }, [board, classTitle]);

  // Load chapters when board/subject/class change
  React.useEffect(() => {
    (async () => {
      if (!board || !subject) { setChapters([]); setChapterId(''); return; }
      try {
        const url = `${API_BASE}/api/curriculum/chapters?board=${encodeURIComponent(board)}&subject=${encodeURIComponent(subject)}${classTitle ? `&classTitle=${encodeURIComponent(classTitle)}` : ''}`;
        const data = await fetch(url).then(r=>r.json());
        setChapters(Array.isArray(data) ? data : []);
      } catch (_) { setChapters([]); }
    })();
  }, [board, subject, classTitle]);

  // Load units and modules when chapter changes
  React.useEffect(() => {
    if (!chapterId) { setUnits([]); setModules([]); setUnitId(''); setModuleId(''); setItems([]); setItemId(''); return; }
    (async () => {
      try {
        const u = await fetch(`${API_BASE}/api/curriculum/units?chapterId=${chapterId}`).then(r=>r.json());
        setUnits(Array.isArray(u) ? u : []);
        const res = await fetch(`${API_BASE}/api/curriculum/modules?chapterId=${chapterId}`).then(r=>r.json());
        setModules(Array.isArray(res) ? res : []);
      } catch (_) {}
    })();
  }, [chapterId]);

  // Reload modules when unit changes
  React.useEffect(() => {
    (async () => {
      if (!unitId) return; // optional
      try {
        const m = await fetch(`${API_BASE}/api/curriculum/modules?unitId=${unitId}`).then(r=>r.json());
        setModules(Array.isArray(m) ? m : []);
      } catch (_) {}
    })();
  }, [unitId]);

  // Load items when module changes
  React.useEffect(() => {
    if (!moduleId) { setItems([]); setItemId(''); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/curriculum/items?moduleId=${moduleId}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
  }, [moduleId]);

  return (
    <div className="min-h-screen bg-[#E5F0FE] p-6 md:p-8 flex items-center">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Left illustration */}
        <div className="flex justify-center md:justify-start md:col-span-4">
          <img src={heroPoint} alt="Mascot pointing" className="w-[360px] md:w-[440px] h-auto drop-shadow-2xl" />
        </div>

        {/* Right upload card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full md:col-span-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-2">Images Upload</h1>
          <p className="text-base text-gray-600 mb-5">Drop an image here or choose a file to upload.</p>

          {/* Drag-and-drop zone */}
          <label
            htmlFor="file-input"
            className="block border-2 border-dashed border-blue-300 rounded-3xl bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer p-6 md:p-8 mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const list = Array.from(e.dataTransfer.files || []);
              if (list.length > 1) setFiles(list);
              else if (list[0]) setFile(list[0]);
            }}
          >
            <div className="flex items-center justify-between gap-5 h-full">
              <div className="flex-1">
                <div className="font-bold text-lg md:text-xl">Click to choose or drag & drop</div>
                <div className="text-sm text-gray-500">PNG, JPG up to ~10MB (supports multiple)</div>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-blue-500 text-white font-bold text-base shadow-lg">Browse</div>
            </div>
            <input id="file-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              const list = Array.from(e.target.files || []);
              if (list.length > 1) setFiles(list);
              else setFile(list[0] || null);
            }} />
          </label>

          {(file || files.length > 0) && (
            <div className="mb-5 flex items-center gap-3">
              {files.length > 0 ? (
                <div className="text-sm text-gray-700 truncate max-w-[60%]">{files.length} files selected</div>
              ) : (
                <div className="text-sm text-gray-700 truncate max-w-[60%]">{file?.name}</div>
              )}
              <button
                onClick={() => { setFile(null); setFiles([]); }}
                className="ml-auto text-sm text-red-600 hover:underline"
              >Remove</button>
            </div>
          )}

          {/* Optional: limit selector (hidden as per request) */}

          <button
            onClick={handleUpload}
            disabled={(!(file || files.length > 0)) || loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-extrabold text-base md:text-lg disabled:opacity-50 shadow-xl"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>

          {error && <p className="text-red-600 mt-3">{error}</p>}

          {(url || uploadedImages.length > 0) && (
            <div className="mt-6">
              {uploadedImages.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700 font-semibold">{uploadedImages.length} images ready to save</div>
                    <button
                      onClick={() => { try { navigator.clipboard.writeText(uploadedImages.map(i=>i.url).join('\n')); setToast({ open: true, type: 'success', text: 'Copied all links', hideAt: Date.now() + 1200 }); } catch (_) {} }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
                    >Copy all</button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {uploadedImages.map((img, idx) => (
                      <div key={img.public_id || idx} className="flex items-center gap-3">
                        <div className="text-[10px] font-bold text-gray-500 w-14 shrink-0">#{idx+1}</div>
                        <div className="hidden md:block text-[10px] text-gray-700 truncate max-w-[30%]" title={img.name || ''}>{img.name || ''}</div>
                        <input
                          value={img.url}
                          readOnly
                          className="w-full rounded-xl border px-3 h-9 bg-white text-[11px] text-gray-700"
                        />
                        <button
                          onClick={() => { try { navigator.clipboard.writeText(img.url || ''); setToast({ open: true, type: 'success', text: 'Copied link', hideAt: Date.now() + 1200 }); } catch (_) {} }}
                          className="px-3 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold"
                        >Copy</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600 mb-1">Uploaded URL</div>
                    <input
                      value={url}
                      readOnly
                      placeholder="https://..."
                      className="w-full max-w-3xl rounded-xl border px-3 h-10 bg-white text-xs text-gray-700"
                    />
                  </div>
                  <button
                    onClick={() => { try { navigator.clipboard.writeText(url || ''); setToast({ open: true, type: 'success', text: 'Copied link', hideAt: Date.now() + 1200 }); } catch (_) {} }}
                    className="px-4 h-10 mt-5 self-center rounded-xl bg-blue-600 text-white text-sm font-bold"
                  >Copy</button>
                </div>
              )}
              {/* Manual link slot */}
              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">Or paste an existing image URL</div>
                <input
                  value={manualUrl}
                  onChange={(e)=>setManualUrl(e.target.value)}
                  placeholder="Paste previous image link here"
                  className="w-full max-w-3xl rounded-xl border px-3 h-10 bg-white text-xs text-gray-700"
                />
              </div>
          {/* Linked selectors from Board → Subject → Chapter → Unit → Module → Item */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-6 gap-3">
                <select value={board} onChange={(e)=>{ setBoard(e.target.value); setChapterId(''); setUnitId(''); setModuleId(''); setItemId(''); }} className="border rounded-xl px-3 py-2">
                  {boards.map(b => (<option key={b._id || b.name} value={b.name || b._id}>{b.name || b.title || 'Board'}</option>))}
                </select>
                <select value={classTitle} onChange={(e)=>{ setClassTitle(e.target.value); setChapterId(''); setUnitId(''); setModuleId(''); setItemId(''); }} className="border rounded-xl px-3 py-2">
                  <option value="">Class</option>
                  {classes.map(c => (<option key={c._id} value={c.name}>{c.name}</option>))}
                </select>
                <select value={subject} onChange={(e)=>{ setSubject(e.target.value); setChapterId(''); setUnitId(''); setModuleId(''); setItemId(''); }} className="border rounded-xl px-3 py-2">
                  <option value="">Subject</option>
                  {subjects.map(s => (<option key={s._id} value={s.name}>{s.name}</option>))}
                </select>
                <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="border rounded-xl px-3 py-2">
                  <option value="">Select Chapter</option>
                  {chapters.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
                <select value={unitId} onChange={(e)=>{ setUnitId(e.target.value); setModuleId(''); setItemId(''); }} className="border rounded-xl px-3 py-2" disabled={!chapterId || units.length===0}>
                  <option value="">Unit</option>
                  {units.map(u => (<option key={u._id} value={u._id}>{u.title}</option>))}
                </select>
                <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="border rounded-xl px-3 py-2" disabled={!chapterId}>
                  <option value="">Select Module</option>
                  {modules.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
                <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="border rounded-xl px-3 py-2" disabled={!moduleId}>
                  <option value="">Select Item</option>
                  {items.map(i => (
                    <option key={i._id} value={i._id}>{i.type} #{i.order}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex justify-between">
                <button
                  onClick={handleRemoveAllFromDb}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold"
                  disabled={!itemId}
                >Remove all images</button>
                <button
                  onClick={handleSaveToDb}
                  className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold"
                  disabled={!itemId}
                >Save to DB</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.open && (
        <div
          role="alert"
          className={`fixed top-6 right-6 z-[10000] transition-all duration-500 ${Date.now() > toast.hideAt - 400 ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}
          onTransitionEnd={() => { if (Date.now() >= toast.hideAt) setToast((t) => ({ ...t, open: false })); }}
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl ring-1 backdrop-blur bg-white/90 ${toast.type === 'success' ? 'ring-green-200' : 'ring-red-200'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white text-sm font-extrabold`}>{toast.type === 'success' ? '✓' : '!'}</div>
            <div className={`text-sm font-extrabold ${toast.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{toast.text}</div>
          </div>
        </div>
      )}
    </div>
  );
}


