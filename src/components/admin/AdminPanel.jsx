import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import curriculumService from '../../services/curriculumService';

// Each section loads on its own, so one heavy or broken section can't stop the panel opening
const ContentEditor = lazy(() => import('./ContentEditor'));
const BlogManager = lazy(() => import('./BlogManager'));
const SystemSettingsManager = lazy(() => import('./SystemSettingsManager'));
const UserAnalytics = lazy(() => import('./UserAnalytics'));
const ExamManager = lazy(() => import('./ExamManager'));
const NotificationAnalytics = lazy(() => import('./NotificationAnalytics'));
const PaymentManager = lazy(() => import('./PaymentManager'));
const GlyphManager = lazy(() => import('./GlyphManager'));
const ReportManager = lazy(() => import('./ReportManager'));
const AudioVoiceManager = lazy(() => import('./AudioVoiceManager'));
const CharacterImageManager = lazy(() => import('./CharacterImageManager'));

// Admin sections, in tab order. `slug` is the address: /admin/<slug>
const SECTIONS = [
  { id: 'curriculum', slug: 'curriculum', icon: '📚', label: 'Content' },
  { id: 'payments', slug: 'payments', icon: '💳', label: 'Payments & Pro' },
  { id: 'analytics', slug: 'analytics', icon: '📊', label: 'User Analytics' },
  { id: 'glyphs', slug: 'glyphs', icon: '🎨', label: 'Glyph Library' },
  { id: 'exams', slug: 'exams', icon: '📝', label: 'Exams' },
  { id: 'reports', slug: 'reports', icon: '🚩', label: 'Reported Issues' },
  { id: 'audio_voice', slug: 'audio-voice', icon: '🎙️', label: 'Audio & Voice' },
  { id: 'character_images', slug: 'character-images', icon: '🧑‍🎨', label: 'Character Images' },
  { id: 'settings', slug: 'settings', icon: '⚙️', label: 'System Settings' },
  { id: 'blogs', slug: 'blogs', icon: '✍️', label: 'Blog' },
  { id: 'notification_analytics', slug: 'notifications', icon: '🔔', label: 'Notifications' },
];
const sectionBySlug = (slug) => SECTIONS.find(sec => sec.slug === slug) || null;

// Catches a crash inside one section and offers a retry, instead of a blank admin panel
class SectionBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('[Admin] Section failed:', error); }
  render() {
    if (!this.state.error) return this.props.children;
    const chunkFailed = /dynamically imported module|Loading chunk|Failed to fetch/i.test(String(this.state.error?.message || ''));
    return (
      <div className="max-w-3xl mx-auto my-10 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
        <p className="font-black text-rose-800">This section couldn't load.</p>
        <p className="text-sm text-rose-700 mt-1">{chunkFailed ? 'A newer version of the admin panel is available.' : String(this.state.error?.message || 'Unexpected error')}</p>
        <button
          onClick={() => (chunkFailed ? window.location.reload() : this.setState({ error: null }))}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
        >
          {chunkFailed ? 'Reload' : 'Retry'}
        </button>
      </div>
    );
  }
}

const SectionLoading = () => (
  <div className="py-16 flex items-center justify-center gap-3 text-sm font-bold text-slate-500">
    <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    Loading…
  </div>
);

const UnitEditRow = ({ unit, onUpdateUnit }) => {
  const [title, setTitle] = useState(unit.title || '');
  const [headerBgUrl, setHeaderBgUrl] = useState(unit.headerBgUrl || '');
  const [timelineBgUrl, setTimelineBgUrl] = useState(unit.timelineBgUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(unit.title || '');
    setHeaderBgUrl(unit.headerBgUrl || '');
    setTimelineBgUrl(unit.timelineBgUrl || '');
  }, [unit]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdateUnit(unit._id, { title, headerBgUrl, timelineBgUrl });
      alert('Unit updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row gap-4 items-end mb-3 last:mb-0">
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-600 mb-1">Unit Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-600 mb-1">Header Background URL</label>
        <input
          type="text"
          value={headerBgUrl}
          onChange={(e) => setHeaderBgUrl(e.target.value)}
          placeholder="e.g. Image URL or pattern"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-600 mb-1">Timeline Background URL</label>
        <input
          type="text"
          value={timelineBgUrl}
          onChange={(e) => setTimelineBgUrl(e.target.value)}
          placeholder="e.g. Image URL or pattern"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-md shadow focus:outline-none transition-colors"
      >
        {saving ? 'Saving...' : 'Save Unit'}
      </button>
    </div>
  );
};

const MAP_STYLES = [
  { value: 'auto', label: 'Auto', hint: 'Path view for chapters with 5+ units' },
  { value: 'path', label: 'Path (Duolingo)', hint: 'Winding path of lesson bubbles' },
  { value: 'classic', label: 'Classic', hint: 'Unit cards with timeline backgrounds' },
];

// Lesson map layout and the full-page background shown behind the path view
const ChapterDisplayCard = ({ chapter, onSaved }) => {
  const [mapStyle, setMapStyle] = useState(chapter.mapStyle || 'auto');
  const [bgUrl, setBgUrl] = useState(chapter.backgroundImage || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setMapStyle(chapter.mapStyle || 'auto');
    setBgUrl(chapter.backgroundImage || '');
    setMsg('');
  }, [chapter._id, chapter.mapStyle, chapter.backgroundImage]);

  const save = async () => {
    try {
      setSaving(true);
      setMsg('');
      const res = await curriculumService.updateChapterDisplay(chapter._id, { mapStyle, backgroundImage: bgUrl.trim() });
      onSaved(res.data);
      setMsg('Saved. Students see it the next time they open the chapter.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Chapter Map Style &amp; Background</h2>
      <p className="text-xs text-gray-500 mb-4">{chapter.title}</p>
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-1/2">
          <label className="block text-xs font-bold text-gray-600 mb-2">Lesson map style</label>
          <div className="grid grid-cols-3 gap-2">
            {MAP_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setMapStyle(s.value)}
                className={`rounded-xl border-2 px-2 py-2.5 text-left transition-colors ${mapStyle === s.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="block text-sm font-bold text-gray-800">{s.label}</span>
                <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:w-1/2">
          <label className="block text-xs font-bold text-gray-600 mb-2">Page background image URL (path view)</label>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={bgUrl}
              onChange={(e) => setBgUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/... (leave empty for the default)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {bgUrl.trim() && (
              <img src={bgUrl.trim()} alt="" className="w-12 h-20 object-cover rounded-md border border-gray-200 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">One image for the whole page; it stays in place while lessons scroll. A tall (portrait) image works best.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-md shadow transition-colors"
        >
          {saving ? 'Saving...' : 'Save Map Settings'}
        </button>
        {msg && <span className="text-xs font-semibold text-gray-600">{msg}</span>}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  // The address is the state: /admin/<section>/<sub-tab>?board=&class=&subject=&chapter=&module=
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectionSlug = '', subTab = ''] = String(params['*'] || '').split('/');
  const activeSection = sectionBySlug(sectionSlug) || SECTIONS[0];
  const activeTab = activeSection.id;
  const setActiveTab = (id) => {
    const target = SECTIONS.find(sec => sec.id === id);
    if (!target) return;
    // Content and Exams share the chapter picker, so they keep its place in the address
    const keep = ['curriculum', 'exams'].includes(id) ? window.location.search : '';
    navigate(`/admin/${target.slug}${keep}`);
  };
  // Old or wrong addresses land on a real section
  useEffect(() => {
    if (!sectionBySlug(sectionSlug)) navigate(`/admin/${SECTIONS[0].slug}${window.location.search}`, { replace: true });
  }, [sectionSlug]);

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [modules, setModules] = useState([]);
  
  // Content path picked so far, restored from the address after a refresh or a shared link
  const fromUrl = useRef({
    board: searchParams.get('board') || '',
    class: searchParams.get('class') || '',
    subject: searchParams.get('subject') || '',
    chapter: searchParams.get('chapter') || '',
    module: searchParams.get('module') || ''
  });
  const [selectedBoard, setSelectedBoard] = useState(fromUrl.current.board);
  const [selectedClass, setSelectedClass] = useState(fromUrl.current.class);
  const [selectedSubject, setSelectedSubject] = useState(fromUrl.current.subject);
  const [selectedChapter, setSelectedChapter] = useState(fromUrl.current.chapter);
  const [selectedModule, setSelectedModule] = useState(fromUrl.current.module);
  // While a level still matches what the address restored, its children are kept, not cleared
  const restoring = (level, value) => Boolean(value) && fromUrl.current[level] === value;

  useEffect(() => {
    if (!['curriculum', 'exams'].includes(activeTab)) return;
    const next = new URLSearchParams();
    if (selectedBoard) next.set('board', selectedBoard);
    if (selectedClass) next.set('class', selectedClass);
    if (selectedSubject) next.set('subject', selectedSubject);
    if (selectedChapter) next.set('chapter', selectedChapter);
    if (selectedModule && activeTab === 'curriculum') next.set('module', selectedModule);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [activeTab, selectedBoard, selectedClass, selectedSubject, selectedChapter, selectedModule]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch boards on mount
  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await curriculumService.listBoards();
      setBoards(response.data || []);
    } catch (err) {
      setError('Failed to fetch boards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes when board is selected
  useEffect(() => {
    if (selectedBoard) {
      if (restoring('board', selectedBoard)) { fetchClasses(); return; }
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedChapter('');
      setSelectedModule('');
      setClasses([]);
      setSubjects([]);
      setChapters([]);
      setModules([]);
      fetchClasses();
    }
  }, [selectedBoard]);

  const fetchClasses = async () => {
    if (!selectedBoard) return;
    try {
      setLoading(true);
      const response = await curriculumService.listClasses(selectedBoard);
      setClasses(response.data || []);
    } catch (err) {
      setError('Failed to fetch classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedBoard && selectedClass) {
      if (restoring('class', selectedClass)) { fetchSubjects(); return; }
      setSelectedSubject('');
      setSelectedChapter('');
      setSelectedModule('');
      setSubjects([]);
      setChapters([]);
      setModules([]);
      fetchSubjects();
    }
  }, [selectedBoard, selectedClass]);

  const fetchSubjects = async () => {
    if (!selectedBoard || !selectedClass) return;
    try {
      setLoading(true);
      const response = await curriculumService.listSubjects(selectedBoard, {
        params: { board: selectedBoard, classTitle: selectedClass }
      });
      setSubjects(response.data || []);
    } catch (err) {
      setError('Failed to fetch subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chapters when subject is selected
  useEffect(() => {
    if (selectedBoard && selectedSubject) {
      if (restoring('subject', selectedSubject)) { fetchChapters(); return; }
      setSelectedChapter('');
      setSelectedModule('');
      setChapters([]);
      setModules([]);
      fetchChapters();
    }
  }, [selectedBoard, selectedSubject]);

  const fetchChapters = async () => {
    if (!selectedBoard || !selectedSubject) return;
    try {
      setLoading(true);
      const response = await curriculumService.listChapters(
        selectedBoard,
        selectedSubject,
        { classTitle: selectedClass }
      );
      setChapters(response.data || []);
    } catch (err) {
      setError('Failed to fetch chapters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [units, setUnits] = useState([]);
  
  const handleTogglePublishChapter = async () => {
    if (!selectedChapter) return;
    const chap = chapters.find(c => c._id === selectedChapter);
    if (!chap) return;

    try {
      setLoading(true);
      const res = await curriculumService.toggleChapterPublishStatus(selectedChapter, !chap.isPublished);
      // Update local state without fetching again to avoid cache issues
      setChapters(prev => prev.map(c => c._id === selectedChapter ? { ...c, isPublished: res.data.isPublished } : c));
    } catch (err) {
      setError('Failed to toggle chapter publish status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch modules and units when chapter is selected
  useEffect(() => {
    if (selectedChapter) {
      if (restoring('chapter', selectedChapter)) { fetchModules(); fetchUnits(); return; }
      setSelectedModule('');
      setModules([]);
      setUnits([]);
      fetchModules();
      fetchUnits();
    }
  }, [selectedChapter]);

  const fetchUnits = async () => {
    if (!selectedChapter) return;
    try {
      const response = await curriculumService.listUnits(selectedChapter, { bypassCache: true });
      setUnits(response.data || []);
    } catch (err) {
      console.error('Failed to fetch units', err);
    }
  };

  const handleUpdateUnit = async (unitId, updateData) => {
    try {
      await curriculumService.updateUnit(unitId, updateData);
      try {
        sessionStorage.removeItem(`unit_list_cache_v1__${selectedChapter}`);
      } catch (_) {}
      fetchUnits();
    } catch (err) {
      setError('Failed to update unit');
      console.error(err);
    }
  };

  const fetchModules = async () => {
    if (!selectedChapter) return;
    try {
      setLoading(true);
      const response = await curriculumService.listModules(selectedChapter, { bypassCache: true });
      setModules(response.data || []);
    } catch (err) {
      setError('Failed to fetch modules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardChange = (e) => {
    fromUrl.current = {};
    setSelectedBoard(e.target.value);
  };

  const handleClassChange = (e) => {
    fromUrl.current = {};
    setSelectedClass(e.target.value);
  };

  const handleSubjectChange = (e) => {
    fromUrl.current = {};
    setSelectedSubject(e.target.value);
  };

  const handleChapterChange = (e) => {
    fromUrl.current = {};
    setSelectedChapter(e.target.value);
  };

  const handleModuleChange = (e) => {
    fromUrl.current = {};
    setSelectedModule(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Premium Tab Navigation Header ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Panel Title */}
          <div className="flex items-center justify-between py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-black">A</span>
              </div>
              <div>
                <h1 className="text-base font-black text-slate-800 leading-tight">Hoshiyaar Admin</h1>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full hidden sm:block">
                Admin Mode
              </div>
              <button
                onClick={() => navigate('/home')}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Go to Home
              </button>
            </div>
          </div>

          {/* Tab Bar: every section has its own address */}
          <div className="flex gap-1 pt-1 overflow-x-auto no-scrollbar">
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`/admin/${sec.slug}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab still works
                  e.preventDefault();
                  setActiveTab(sec.id);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-200 focus:outline-none ${
                  activeTab === sec.id
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{sec.icon}</span>
                <span>{sec.label}</span>
              </a>
            ))}
            <a
              href="https://hoshiyaar-image.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-200 focus:outline-none border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            >
              <span className="text-base">🖼️</span>
              <span>Image Upload Link ↗</span>
            </a>
          </div>
        </div>
      </div>

      <SectionBoundary key={activeTab}>
      <Suspense fallback={<SectionLoading />}>
      {/* ── Tab Panel: Content Management & Exams ── */}
      {(activeTab === 'curriculum' || activeTab === 'exams') && (
        <div className="max-w-7xl mx-auto py-8 px-4">

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Cascading Dropdowns */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Content Path</h2>

            <div className={`grid grid-cols-1 ${activeTab === 'curriculum' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
              {/* Board Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Board</label>
                <select
                  value={selectedBoard}
                  onChange={handleBoardChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option value="">Select Board</option>
                  {boards.map((board) => (
                    <option key={board._id} value={board.name}>{board.name}</option>
                  ))}
                </select>
              </div>

              {/* Class Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!selectedBoard || loading}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!selectedBoard || !selectedClass || loading}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
              </div>

              {/* Chapter Dropdown */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-gray-700">Chapter</label>
                  {selectedChapter && chapters.find(c => c._id === selectedChapter) && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${chapters.find(c => c._id === selectedChapter).isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {chapters.find(c => c._id === selectedChapter).isPublished ? 'Published' : 'Draft'}
                      </span>
                      <button 
                        onClick={handleTogglePublishChapter}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        {chapters.find(c => c._id === selectedChapter).isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  )}
                </div>
                <select
                  value={selectedChapter}
                  onChange={handleChapterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!selectedBoard || !selectedSubject || loading}
                >
                  <option value="">Select Chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>{chapter.title}</option>
                  ))}
                </select>
              </div>

              {/* Module Dropdown */}
              {activeTab === 'curriculum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                  <select
                    value={selectedModule}
                    onChange={handleModuleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!selectedChapter || loading}
                  >
                    <option value="">Select Module</option>
                    {modules.map((module) => (
                      <option key={module._id} value={module._id}>{module.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {selectedChapter && activeTab === 'curriculum' && chapters.find(c => c._id === selectedChapter) && (
            <ChapterDisplayCard
              chapter={chapters.find(c => c._id === selectedChapter)}
              onSaved={(saved) => setChapters(prev => prev.map(c => c._id === saved._id ? { ...c, mapStyle: saved.mapStyle, backgroundImage: saved.backgroundImage } : c))}
            />
          )}

          {/* Unit Management section when chapter is selected */}
          {selectedChapter && units.length > 0 && activeTab === 'curriculum' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Unit Image &amp; Background Settings</h2>
              <div className="grid grid-cols-1 gap-4">
                {units.map((unit) => (
                  <UnitEditRow key={unit._id} unit={unit} onUpdateUnit={handleUpdateUnit} />
                ))}
              </div>
            </div>
          )}

          {/* Content Editor */}
          {selectedModule && activeTab === 'curriculum' && (
            <ContentEditor
              moduleId={selectedModule}
              moduleTitle={modules.find(m => m._id === selectedModule)?.title || ''}
              boardTitle={selectedBoard}
              classTitle={selectedClass}
              subjectTitle={selectedSubject}
              chapterId={selectedChapter}
              chapterTitle={chapters.find(c => c._id === selectedChapter)?.title || ''}
            />
          )}

          {/* Exam Manager */}
          {selectedChapter && activeTab === 'exams' && (
            <div className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-black text-slate-800 mb-4 px-2">Exam Configuration</h2>
              <ExamManager 
                chapterId={selectedChapter}
                chapterTitle={chapters.find(c => c._id === selectedChapter)?.title || ''}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab Panel: Blog Manager ── */}
      {activeTab === 'blogs' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800">Blog Management</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Create, edit, and manage articles for the Hoshiyaar blog.
            </p>
          </div>
          <BlogManager />
        </div>
      )}

      {/* ── Tab Panel: System Settings ── */}
      {activeTab === 'settings' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800">System Settings</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Configure global app settings like homepage videos and carousel slides.
            </p>
          </div>
          <SystemSettingsManager />
        </div>
      )}

      {/* ── Tab Panel: Payments & Subscriptions ── */}
      {activeTab === 'payments' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <PaymentManager subTab={subTab} onSubTab={(sub) => navigate(`/admin/payments/${sub}`)} />
        </div>
      )}

      {/* ── Tab Panel: User Analytics & Tracking ── */}
      {activeTab === 'analytics' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800">User Analytics &amp; Tracking</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Comprehensive student progress, active session durations, accuracy rates, and engagement metrics across all users.
            </p>
          </div>
          <UserAnalytics />
        </div>
      )}

      {/* ── Tab Panel: Notification Analytics ── */}
      {activeTab === 'notification_analytics' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <NotificationAnalytics />
        </div>
      )}

      {/* ── Tab Panel: Reported Issues ── */}
      {activeTab === 'reports' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <ReportManager />
        </div>
      )}

      {/* ── Tab Panel: Audio & Voice Studio ── */}
      {activeTab === 'audio_voice' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <AudioVoiceManager />
        </div>
      )}

      {/* ── Tab Panel: Character Images ── */}
      {activeTab === 'character_images' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <CharacterImageManager />
        </div>
      )}

      {/* ── Tab Panel: Glyph Library ── */}
      {activeTab === 'glyphs' && (
        <div className="max-w-7xl mx-auto py-8 px-4">
          <GlyphManager />
        </div>
      )}
      </Suspense>
      </SectionBoundary>
    </div>
  );
};

export default AdminPanel;

