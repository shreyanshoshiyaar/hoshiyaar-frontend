import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import ContentEditor from './ContentEditor';

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

const AdminPanel = () => {
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [modules, setModules] = useState([]);
  
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  
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

  // Fetch modules and units when chapter is selected
  useEffect(() => {
    if (selectedChapter) {
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
      const response = await curriculumService.listUnits(selectedChapter);
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
      const response = await curriculumService.listModules(selectedChapter);
      setModules(response.data || []);
    } catch (err) {
      setError('Failed to fetch modules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardChange = (e) => {
    setSelectedBoard(e.target.value);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleChapterChange = (e) => {
    setSelectedChapter(e.target.value);
  };

  const handleModuleChange = (e) => {
    setSelectedModule(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel - Content Management</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Cascading Dropdowns */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Content Path</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Board Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board
              </label>
              <select
                value={selectedBoard}
                onChange={handleBoardChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              >
                <option value="">Select Board</option>
                {boards.map((board) => (
                  <option key={board._id} value={board.name}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedBoard || loading}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedBoard || !selectedClass || loading}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={handleChapterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedBoard || !selectedSubject || loading}
              >
                <option value="">Select Chapter</option>
                {chapters.map((chapter) => (
                  <option key={chapter._id} value={chapter._id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Module Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <select
                value={selectedModule}
                onChange={handleModuleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedChapter || loading}
              >
                <option value="">Select Module</option>
                {modules.map((module) => (
                  <option key={module._id} value={module._id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Unit Management section when chapter is selected */}
        {selectedChapter && units.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Unit Image & Background Settings</h2>
            <div className="grid grid-cols-1 gap-4">
              {units.map((unit) => {
                return <UnitEditRow key={unit._id} unit={unit} onUpdateUnit={handleUpdateUnit} />;
              })}
            </div>
          </div>
        )}

        {/* Content Editor */}
        {selectedModule && (
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
      </div>
    </div>
  );
};

export default AdminPanel;
