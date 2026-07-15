import React, { useState, useEffect } from 'react';
import interactiveStoryService from '../../services/interactiveStoryService';
import curriculumService from '../../services/curriculumService';

export default function InteractiveStoryManager() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  
  // Curriculum Dropdown states
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    fetchStories();
    fetchBoards();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await interactiveStoryService.getAllStories();
      setStories(res.data || []);
    } catch (err) {
      setError('Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoards = async () => {
    try {
      const res = await curriculumService.listBoards();
      setBoards(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    const boardToFetch = isEditing ? currentStory?.board : selectedBoard;
    if (boardToFetch) {
      curriculumService.listClasses(boardToFetch).then(res => {
        setClasses(res.data || []);
      }).catch(() => {});
    } else {
      setClasses([]);
      setSubjects([]);
    }
  }, [selectedBoard, currentStory?.board, isEditing]);

  useEffect(() => {
    const boardToFetch = isEditing ? currentStory?.board : selectedBoard;
    const classToFetch = isEditing ? currentStory?.classLevel : selectedClass;
    if (boardToFetch && classToFetch) {
      curriculumService.listSubjects(boardToFetch, { params: { board: boardToFetch, classTitle: classToFetch } }).then(res => {
        setSubjects(res.data || []);
      }).catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [selectedBoard, selectedClass, currentStory?.board, currentStory?.classLevel, isEditing]);

  useEffect(() => {
    const fetchChapters = async () => {
      const boardToFetch = isEditing ? currentStory?.board : selectedBoard;
      const classToFetch = isEditing ? currentStory?.classLevel : selectedClass;
      if (boardToFetch && currentStory?.targetSubject) {
        try {
          const res = await curriculumService.listChapters(boardToFetch, currentStory.targetSubject, { classTitle: classToFetch });
          setChapters(res.data || []);
        } catch (err) { setChapters([]); }
      } else {
        setChapters([]);
      }
    };
    fetchChapters();
  }, [selectedBoard, selectedClass, currentStory?.board, currentStory?.classLevel, currentStory?.targetSubject, isEditing]);

  const handleCreateNew = () => {
    setCurrentStory({
      board: '',
      classLevel: '',
      backgroundImg: '',
      backgroundMusic: '',
      targetSubject: '',
      targetChapterId: '',
      isActive: true,
      slides: []
    });
    setSelectedBoard('');
    setSelectedClass('');
    setIsEditing(true);
  };

  const handleEdit = (story) => {
    setCurrentStory(JSON.parse(JSON.stringify(story)));
    setSelectedBoard(story.board || '');
    setSelectedClass(story.classLevel || '');
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      setLoading(true);
      await interactiveStoryService.deleteStory(id);
      fetchStories();
    } catch (err) {
      setError('Failed to delete story');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!currentStory.board || !currentStory.classLevel) {
        alert("Board and Class are required");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      await interactiveStoryService.createOrUpdateStory(currentStory);
      setIsEditing(false);
      fetchStories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save story');
      setLoading(false);
    }
  };

  const addSlide = () => {
    setCurrentStory({
      ...currentStory,
      slides: [
        ...currentStory.slides,
        { characterImg: '', dialogue: '', audioUrl: '', buttons: [] }
      ]
    });
  };

  const updateSlide = (index, field, value) => {
    const updated = [...currentStory.slides];
    updated[index][field] = value;
    setCurrentStory({ ...currentStory, slides: updated });
  };

  const removeSlide = (index) => {
    const updated = [...currentStory.slides];
    updated.splice(index, 1);
    setCurrentStory({ ...currentStory, slides: updated });
  };

  const addButton = (slideIndex) => {
    const updated = [...currentStory.slides];
    updated[slideIndex].buttons.push({ label: 'Next', nextSlideIndex: slideIndex + 1 });
    setCurrentStory({ ...currentStory, slides: updated });
  };

  const updateButton = (slideIndex, btnIndex, field, value) => {
    const updated = [...currentStory.slides];
    updated[slideIndex].buttons[btnIndex][field] = value;
    setCurrentStory({ ...currentStory, slides: updated });
  };

  const removeButton = (slideIndex, btnIndex) => {
    const updated = [...currentStory.slides];
    updated[slideIndex].buttons.splice(btnIndex, 1);
    setCurrentStory({ ...currentStory, slides: updated });
  };

  if (isEditing && currentStory) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{currentStory._id ? 'Edit Story' : 'Create New Story'}</h2>
          <div className="space-x-3">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Story</button>
          </div>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class (Board)</label>
            <select
              value={currentStory.board}
              onChange={(e) => setCurrentStory({ ...currentStory, board: e.target.value, classLevel: '', targetSubject: '', targetChapterId: '' })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Class</option>
              {boards.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class (Grade)</label>
            <select
              value={currentStory.classLevel}
              onChange={(e) => setCurrentStory({ ...currentStory, classLevel: e.target.value, targetSubject: '', targetChapterId: '' })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!currentStory.board}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Global Background Image URL (Cloudinary)</label>
            <input 
              type="text" 
              value={currentStory.backgroundImg} 
              onChange={e => setCurrentStory({...currentStory, backgroundImg: e.target.value})} 
              className="w-full p-2 border rounded" 
              placeholder="https://res.cloudinary.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Global Background Music URL (MP3)</label>
            <input 
              type="text" 
              value={currentStory.backgroundMusic} 
              onChange={e => setCurrentStory({...currentStory, backgroundMusic: e.target.value})} 
              className="w-full p-2 border rounded"
              placeholder="https://.../music.mp3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Target Subject (For Redirect)</label>
            <select
              value={currentStory.targetSubject || ''}
              onChange={(e) => setCurrentStory({ ...currentStory, targetSubject: e.target.value, targetChapterId: '' })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!currentStory.classLevel}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Target Chapter</label>
            <select
              value={currentStory.targetChapterId || ''}
              onChange={(e) => setCurrentStory({ ...currentStory, targetChapterId: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!currentStory.targetSubject}
            >
              <option value="">Select Chapter</option>
              {chapters.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex items-center mt-6">
            <input 
              type="checkbox" 
              checked={currentStory.isActive} 
              onChange={e => setCurrentStory({...currentStory, isActive: e.target.checked})}
              className="w-5 h-5 mr-2"
            />
            <label className="text-sm font-semibold">Active</label>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-bold">Slides</h3>
          <button onClick={addSlide} className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded hover:bg-green-200">
            + Add Slide
          </button>
        </div>

        <div className="space-y-6">
          {currentStory.slides.map((slide, sIdx) => (
            <div key={sIdx} className="p-4 border rounded-lg bg-gray-50 relative">
              <div className="absolute top-2 right-2 text-xs font-bold text-gray-400">Slide #{sIdx}</div>
              <button onClick={() => removeSlide(sIdx)} className="absolute top-2 right-20 text-xs text-red-500 hover:underline">Remove Slide</button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-bold mb-1">Character Image URL</label>
                  <input type="text" value={slide.characterImg} onChange={e => updateSlide(sIdx, 'characterImg', e.target.value)} className="w-full p-2 text-sm border rounded" placeholder="Character img url..." />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Custom Audio MP3 URL</label>
                  <input type="text" value={slide.audioUrl} onChange={e => updateSlide(sIdx, 'audioUrl', e.target.value)} className="w-full p-2 text-sm border rounded" placeholder="Voice audio mp3..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1">Dialogue Text</label>
                  <textarea value={slide.dialogue} onChange={e => updateSlide(sIdx, 'dialogue', e.target.value)} className="w-full p-2 text-sm border rounded h-20" placeholder="Hello there!"></textarea>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-gray-700">Buttons</h4>
                  <button onClick={() => addButton(sIdx)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">+ Add Button</button>
                </div>
                {slide.buttons.map((btn, bIdx) => (
                  <div key={bIdx} className="flex gap-2 mb-2 items-center">
                    <input type="text" value={btn.label} onChange={e => updateButton(sIdx, bIdx, 'label', e.target.value)} className="flex-1 p-2 text-sm border rounded" placeholder="Button Label" />
                    <input type="number" value={btn.nextSlideIndex} onChange={e => updateButton(sIdx, bIdx, 'nextSlideIndex', parseInt(e.target.value))} className="w-24 p-2 text-sm border rounded" placeholder="Next Slide #" />
                    <button onClick={() => removeButton(sIdx, bIdx)} className="text-red-500 font-bold px-2">X</button>
                  </div>
                ))}
                {slide.buttons.length === 0 && <p className="text-xs text-gray-500 italic">No buttons = auto-continue or tap-to-continue.</p>}
              </div>
            </div>
          ))}
          {currentStory.slides.length === 0 && <p className="text-gray-500 text-center py-4">No slides added yet.</p>}
        </div>

      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Interactive Stories (Onboarding)</h2>
        <button onClick={handleCreateNew} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Create New Story
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && stories.length === 0 && (
        <div className="text-center py-10 text-gray-500">No interactive stories found.</div>
      )}

      <div className="space-y-4">
        {stories.map(story => (
          <div key={story._id} className="p-4 border rounded flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {story.board} - {story.classLevel}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${story.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {story.isActive ? 'Active' : 'Draft'}
                </span>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(story)} className="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200">Edit</button>
              <button onClick={() => handleDelete(story._id)} className="px-3 py-1 bg-red-100 text-red-600 border rounded hover:bg-red-200">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
