import React, { useState, useEffect } from 'react';
import http from '../../services/apiClient.js';

const GlyphManager = () => {
  const [glyphs, setGlyphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [copiedToken, setCopiedToken] = useState('');
  const [editingGlyph, setEditingGlyph] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for creating/editing
  const [form, setForm] = useState({
    name: '',
    folder: 'custom',
    draws: '',
    definitionJson: ''
  });

  useEffect(() => {
    fetchGlyphs();
  }, []);

  const fetchGlyphs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await http.get('/api/glyphs');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setGlyphs(res.data.data);
      } else {
        setGlyphs([]);
      }
    } catch (err) {
      console.error('Failed to fetch glyphs from backend', err);
      setError('Could not load glyphs from backend. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const openEditModal = (glyph) => {
    setEditingGlyph(glyph);
    setIsCreating(false);
    setForm({
      name: glyph.name,
      folder: glyph.folder || 'custom',
      draws: glyph.draws || '',
      definitionJson: JSON.stringify({
        size: glyph.size || [40, 40],
        settings: glyph.settings || {},
        anchors: glyph.anchors || { center: [0, 0] },
        parts: glyph.parts || []
      }, null, 2)
    });
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingGlyph(null);
    setForm({
      name: '',
      folder: 'biology',
      draws: '',
      definitionJson: JSON.stringify({
        size: [40, 40],
        settings: { pos: 'centre [x, y]', scale: 1, style: 'normal' },
        anchors: { center: [0, 0] },
        parts: [
          { shape: 'text', str: 'Example', at: [0, 0], style: 'normal' }
        ]
      }, null, 2)
    });
  };

  const handleSaveGlyph = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Glyph name/token is required');
      return;
    }

    let parsedDef = {};
    try {
      parsedDef = JSON.parse(form.definitionJson);
    } catch (parseErr) {
      alert('Invalid Definition JSON: ' + parseErr.message);
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        name: form.name.trim().toLowerCase(),
        folder: form.folder.trim(),
        draws: form.draws.trim() || form.name.trim(),
        size: parsedDef.size || [40, 40],
        settings: parsedDef.settings || {},
        anchors: parsedDef.anchors || { center: [0, 0] },
        parts: parsedDef.parts || []
      };

      const res = await http.post('/api/glyphs', payload);
      if (res.data?.success) {
        setSuccess(`Glyph "${payload.name}" saved successfully to MongoDB!`);
        setTimeout(() => setSuccess(''), 4000);
        setEditingGlyph(null);
        setIsCreating(false);
        fetchGlyphs();
      }
    } catch (err) {
      console.error('Error saving glyph:', err);
      alert('Failed to save glyph: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGlyph = async (name) => {
    if (!window.confirm(`Are you sure you want to delete glyph "${name}" from backend database?`)) {
      return;
    }

    try {
      const res = await http.delete(`/api/glyphs/${encodeURIComponent(name)}`);
      if (res.data?.success) {
        setSuccess(`Glyph "${name}" deleted.`);
        setTimeout(() => setSuccess(''), 3000);
        fetchGlyphs();
      }
    } catch (err) {
      console.error('Error deleting glyph:', err);
      alert('Failed to delete glyph: ' + (err.response?.data?.message || err.message));
    }
  };

  // Folders list
  const folders = Array.from(new Set(glyphs.map(g => g.folder).filter(Boolean))).sort();

  // Filtered list
  const filteredGlyphs = glyphs.filter(g => {
    const matchesFolder = selectedFolder === 'all' || (g.folder || '').toLowerCase() === selectedFolder.toLowerCase();
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      (g.name || '').toLowerCase().includes(q) || 
      (g.draws || '').toLowerCase().includes(q) ||
      (g.folder || '').toLowerCase().includes(q);
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800">Blackboard Vector Glyph Library</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">
              {glyphs.length} in MongoDB Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chalkboard drawing tokens and vector primitives stored in backend database. Use these tokens in Blackboard cards (e.g. <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">chapati -&gt; teeth -&gt; tiny pieces</code>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGlyphs}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            title="Reload from backend"
          >
            🔄 Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            + Add New Glyph
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="my-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="my-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-semibold flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 my-5">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token (e.g. teeth, chapati, stomach) or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Folder:</label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Folders ({glyphs.length})</option>
            {folders.map(f => (
              <option key={f} value={f}>
                {f} ({glyphs.filter(g => g.folder === f).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Glyphs Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading vector glyphs from backend...</div>
      ) : filteredGlyphs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          No glyphs match your query. Click "+ Add New Glyph" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredGlyphs.map((glyph) => {
            const isCopied = copiedToken === glyph.name;
            const partsCount = (glyph.parts || []).length;

            return (
              <div
                key={glyph._id || glyph.name}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl p-3.5 text-white flex flex-col justify-between transition-all group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                      {glyph.folder || 'custom'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {partsCount} shape{partsCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 className="font-mono font-bold text-sm text-cyan-200 truncate mt-1">
                    {glyph.name}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 mt-1 min-h-[32px]">
                    {glyph.draws || glyph.name}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(glyph.name)}
                    className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all text-center ${
                      isCopied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                    }`}
                    title="Click to copy glyph code token"
                  >
                    {isCopied ? '✓ Copied!' : 'Copy Code'}
                  </button>

                  <button
                    onClick={() => openEditModal(glyph)}
                    className="p-1 px-2 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                    title="Edit definition"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDeleteGlyph(glyph.name)}
                    className="p-1 px-2 rounded bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                    title="Delete glyph"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit */}
      {(isCreating || editingGlyph) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-cyan-300">
                {isCreating ? '+ Add New Chalkboard Glyph' : `Edit Glyph: ${editingGlyph?.name}`}
              </h3>
              <button
                onClick={() => { setEditingGlyph(null); setIsCreating(false); }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGlyph} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Glyph Token Name (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().trim() })}
                    placeholder="e.g. teeth, chapati, peristalsis"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-cyan-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This is what teachers and curriculum writers enter in arrow notation (e.g. <span className="font-mono text-cyan-300">teeth</span>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Folder / Category
                  </label>
                  <input
                    type="text"
                    value={form.folder}
                    onChange={(e) => setForm({ ...form, folder: e.target.value })}
                    placeholder="e.g. biology, digestive, nutrients, custom"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  What It Draws (Description)
                </label>
                <input
                  type="text"
                  value={form.draws}
                  onChange={(e) => setForm({ ...form, draws: e.target.value })}
                  placeholder="e.g. Molars & Incisors chewing food"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Vector Definition JSON (size, settings, anchors, parts) *
                </label>
                <textarea
                  rows={8}
                  required
                  value={form.definitionJson}
                  onChange={(e) => setForm({ ...form, definitionJson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder='{"size": [40, 40], "anchors": {"center": [0,0]}, "parts": []}'
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setEditingGlyph(null); setIsCreating(false); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving to Database...' : 'Save to MongoDB Backend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlyphManager;
