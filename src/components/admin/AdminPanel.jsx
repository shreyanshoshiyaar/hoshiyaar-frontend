import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import ContentEditor from './ContentEditor';

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

  // Fetch modules when chapter is selected
  useEffect(() => {
    if (selectedChapter) {
      setSelectedModule('');
      setModules([]);
      fetchModules();
    }
  }, [selectedChapter]);

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
