import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import http from '../../services/apiClient';

const ExamManager = ({ chapterId, chapterTitle }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectKnowledge, setSubjectKnowledge] = useState('');
  const [flowItems, setFlowItems] = useState([]);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkCardUrls, setBulkCardUrls] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (chapterId) {
      loadExamConfig();
    }
  }, [chapterId]);

  const loadExamConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await curriculumService.getSetting(`exam_config_${chapterId}`);
      if (response.data && response.data.value) {
        const val = response.data.value;
        setSubjectKnowledge(val.subjectKnowledge || '');

        if (Array.isArray(val.flowItems) && val.flowItems.length > 0) {
          const items = val.flowItems.map((item, idx) => ({
            id: item.id || `item_${idx}_${Date.now()}`,
            type: item.type || 'descriptive_question',
            content: item.content || item.image || '',
            title: item.title || '',
            text: item.text || item.question || item.content?.text || '',
            expected: item.expected || item.expectedAnswer || item.content?.expected || item.answer || '',
            options: Array.isArray(item.options) ? item.options : (Array.isArray(item.content?.options) ? item.content.options : []),
            image: item.image || item.content?.image || null
          }));
          setFlowItems(items);
        } else {
          // Fallback legacy structure reconstruction
          const items = [];
          const revCards = val.revisionCards || [];
          const descQs = val.questions || [];
          const mcqQs = val.mcqs || [];

          revCards.forEach((rc, i) => {
            items.push({
              id: `card_${i}_${Date.now()}`,
              type: 'revision_card',
              content: typeof rc === 'string' ? rc : (rc.content || rc.image || ''),
              title: rc.title || `Revision Card ${i + 1}`,
              text: '',
              expected: '',
              options: [],
              image: null
            });
          });

          descQs.forEach((q, i) => {
            items.push({
              id: `desc_${i}_${Date.now()}`,
              type: 'descriptive_question',
              content: '',
              title: '',
              text: typeof q === 'string' ? q : (q.text || q.question || ''),
              expected: q.expected || q.expectedAnswer || '',
              options: [],
              image: q.image || null
            });
          });

          mcqQs.forEach((m, i) => {
            items.push({
              id: `mcq_${i}_${Date.now()}`,
              type: 'mcq',
              content: '',
              title: '',
              text: m.text || m.question || '',
              expected: m.expected || m.expectedAnswer || '',
              options: Array.isArray(m.options) ? m.options : [],
              image: m.image || null
            });
          });

          setFlowItems(items);
        }
      } else {
        setSubjectKnowledge('');
        setFlowItems([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setSubjectKnowledge('');
        setFlowItems([]);
      } else {
        console.error('Failed to load exam config', err);
        setError('Failed to load exam configuration.');
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const sanitizedFlow = flowItems.map((item, idx) => {
        if (item.type === 'revision_card') {
          return {
            type: 'revision_card',
            content: item.content || item.image || '',
            title: item.title || ''
          };
        } else if (item.type === 'descriptive_question') {
          return {
            type: 'descriptive_question',
            text: item.text || '',
            expected: item.expected || '',
            ...(item.image ? { image: item.image } : {})
          };
        } else if (item.type === 'mcq') {
          return {
            type: 'mcq',
            text: item.text || '',
            question: item.text || '',
            expected: item.expected || (item.options?.[0] || ''),
            options: item.options || [],
            ...(item.image ? { image: item.image } : {})
          };
        }
        return item;
      });

      const revisionCards = sanitizedFlow
        .filter(i => i.type === 'revision_card' && i.content)
        .map(i => i.content);

      const questions = sanitizedFlow
        .filter(i => i.type === 'descriptive_question')
        .map(i => ({ text: i.text, expected: i.expected, ...(i.image ? { image: i.image } : {}) }));

      const mcqs = sanitizedFlow
        .filter(i => i.type === 'mcq')
        .map(i => ({ text: i.text, question: i.text, expected: i.expected, options: i.options, ...(i.image ? { image: i.image } : {}) }));

      await curriculumService.updateSetting({
        key: `exam_config_${chapterId}`,
        value: {
          subjectKnowledge,
          flowItems: sanitizedFlow,
          revisionCards,
          questions,
          mcqs
        }
      });

      setSuccess('Exam sequence and configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save exam config', err);
      setError('Failed to save exam configuration.');
    }
    setSaving(false);
  };

  const addRevisionCard = (index = flowItems.length, initialUrl = '') => {
    const newItem = {
      id: `card_${Date.now()}_${Math.random()}`,
      type: 'revision_card',
      content: initialUrl,
      title: '',
      text: '',
      expected: '',
      options: [],
      image: null
    };
    const next = [...flowItems];
    next.splice(index, 0, newItem);
    setFlowItems(next);
  };

  const addDescriptiveQuestion = (index = flowItems.length) => {
    const newItem = {
      id: `desc_${Date.now()}_${Math.random()}`,
      type: 'descriptive_question',
      content: '',
      title: '',
      text: '',
      expected: '',
      options: [],
      image: null
    };
    const next = [...flowItems];
    next.splice(index, 0, newItem);
    setFlowItems(next);
  };

  const addMcqQuestion = (index = flowItems.length) => {
    const newItem = {
      id: `mcq_${Date.now()}_${Math.random()}`,
      type: 'mcq',
      content: '',
      title: '',
      text: '',
      expected: 'Option A',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      image: null
    };
    const next = [...flowItems];
    next.splice(index, 0, newItem);
    setFlowItems(next);
  };

  const removeItem = (index) => {
    const next = [...flowItems];
    next.splice(index, 1);
    setFlowItems(next);
  };

  const moveItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= flowItems.length) return;
    const next = [...flowItems];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setFlowItems(next);
  };

  const updateItemField = (index, field, value) => {
    const next = [...flowItems];
    next[index] = { ...next[index], [field]: value };
    setFlowItems(next);
  };

  const handleItemImageUpload = async (index, file, isRevisionCard = false) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert(`File ${file.name} is too large. Max 50MB.`);
      return;
    }

    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await http.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data && response.data.imageUrl) {
        if (isRevisionCard) {
          updateItemField(index, 'content', response.data.imageUrl);
        } else {
          updateItemField(index, 'image', response.data.imageUrl);
        }
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image: ' + (err.message || 'Network error'));
    }
    setUploadingIndex(null);
  };

  const handleBulkAddRevisionCards = () => {
    const urls = bulkCardUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http'));

    if (urls.length === 0) {
      alert('Please paste valid image URLs (one per line).');
      return;
    }

    const newCards = urls.map(url => ({
      id: `card_${Date.now()}_${Math.random()}`,
      type: 'revision_card',
      content: url,
      title: '',
      text: '',
      expected: '',
      options: [],
      image: null
    }));

    setFlowItems(prev => [...prev, ...newCards]);
    setBulkCardUrls('');
    setShowBulkModal(false);
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading Exam Configuration...</div>;
  }

  const counts = {
    total: flowItems.length,
    cards: flowItems.filter(i => i.type === 'revision_card').length,
    descriptive: flowItems.filter(i => i.type === 'descriptive_question').length,
    mcq: flowItems.filter(i => i.type === 'mcq').length
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-7 max-w-5xl mx-auto my-6 text-slate-800">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs uppercase tracking-wider">
              Exam Flow Sequence
            </span>
            <span className="text-xs text-slate-400">Total {counts.total} items</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {chapterTitle || 'Chapter Exam'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sequence revision cards and questions in the exact order students will encounter them. You can place multiple revision cards anywhere, before or between questions.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 shrink-0">
          <span className="text-indigo-600">🖼 {counts.cards} Cards</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-600">📝 {counts.descriptive} Descriptive</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600">🔘 {counts.mcq} MCQs</span>
        </div>
      </div>

      {error && <div className="mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}
      {success && <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">{success}</div>}

      {/* AI Subject Knowledge Context */}
      <div className="mt-6 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
          Subject Knowledge (AI Context for Evaluation)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Specific syllabus constraints, facts, or concepts to guide the AI when evaluating student answers.
        </p>
        <textarea
          value={subjectKnowledge}
          onChange={(e) => setSubjectKnowledge(e.target.value)}
          rows="3"
          className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          placeholder="e.g. Focus on Class 7 Science Chapter 3: Heat and Temperature. Strict adherence to NCERT syllabus..."
        />
      </div>

      {/* Add Item Action Bar */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-indigo-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Add New Flow Step:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addRevisionCard()}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>🖼</span> + Revision Card
          </button>
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Paste multiple Cloudinary links at once"
          >
            <span>📑</span> + Bulk Cards
          </button>
          <button
            type="button"
            onClick={() => addDescriptiveQuestion()}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>📝</span> + Descriptive Q
          </button>
          <button
            type="button"
            onClick={() => addMcqQuestion()}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>🔘</span> + MCQ
          </button>
        </div>
      </div>

      {/* Flow Items List */}
      {flowItems.length === 0 ? (
        <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <div className="text-4xl mb-2">🎯</div>
          <h4 className="font-bold text-slate-700 text-sm">No Flow Items in Exam</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Get started by adding revision comic cards, descriptive questions, or multiple choice questions using the buttons above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flowItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === flowItems.length - 1;

            return (
              <div
                key={item.id || index}
                className={`rounded-2xl border p-4 transition-all shadow-sm ${
                  item.type === 'revision_card'
                    ? 'bg-indigo-50/40 border-indigo-200/80 hover:border-indigo-300'
                    : item.type === 'descriptive_question'
                    ? 'bg-blue-50/30 border-blue-200/80 hover:border-blue-300'
                    : 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                }`}
              >
                {/* Item Header Controls */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        item.type === 'revision_card'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : item.type === 'descriptive_question'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {item.type === 'revision_card' && '🖼 Revision Card (Comic Image)'}
                      {item.type === 'descriptive_question' && '📝 Descriptive Question'}
                      {item.type === 'mcq' && '🔘 Multiple Choice (MCQ)'}
                    </span>
                  </div>

                  {/* Move Up / Down & Delete Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={isFirst}
                      title="Move Up"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={isLast}
                      title="Move Down"
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete step #${index + 1}?`)) {
                          removeItem(index);
                        }
                      }}
                      title="Delete Step"
                      className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 flex items-center justify-center text-xs font-bold transition-all shadow-sm ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* ITEM BODY: REVISION CARD */}
                {item.type === 'revision_card' && (
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Thumbnail Preview */}
                      <div className="w-full md:w-44 h-32 bg-white rounded-xl border border-indigo-200 overflow-hidden shrink-0 flex items-center justify-center relative group">
                        {item.content ? (
                          <img
                            src={item.content}
                            alt={`Revision card ${index + 1}`}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="text-slate-400 text-xs text-center p-2">
                            No image selected
                          </div>
                        )}
                        {item.content && (
                          <a
                            href={item.content}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity"
                          >
                            🔍 Open Image
                          </a>
                        )}
                      </div>

                      {/* URL & File Upload */}
                      <div className="flex-1 w-full space-y-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Image Cloudinary URL
                          </label>
                          <input
                            type="text"
                            value={item.content || ''}
                            onChange={(e) => updateItemField(index, 'content', e.target.value)}
                            placeholder="https://res.cloudinary.com/..."
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm">
                            <span>📁</span>
                            <span>{uploadingIndex === index ? 'Uploading...' : 'Upload Image File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingIndex === index}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleItemImageUpload(index, file, true);
                              }}
                            />
                          </label>

                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => updateItemField(index, 'title', e.target.value)}
                            placeholder="Optional card title / caption"
                            className="flex-1 min-w-[200px] p-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ITEM BODY: DESCRIPTIVE QUESTION */}
                {item.type === 'descriptive_question' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Question Text
                      </label>
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => updateItemField(index, 'text', e.target.value)}
                        rows="2"
                        placeholder="Enter the descriptive question here..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700 uppercase mb-1 flex items-center gap-1">
                        <span>🎯</span> Expected / Model Answer (Evaluated by AI & shown in review)
                      </label>
                      <textarea
                        value={item.expected || ''}
                        onChange={(e) => updateItemField(index, 'expected', e.target.value)}
                        rows="2"
                        placeholder="Key points and model explanation expected from the student..."
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* Optional Diagram Image */}
                    <div className="pt-2 border-t border-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 shadow-sm">
                        <span>📷</span>
                        <span>{item.image ? 'Change Diagram' : '+ Add Question Diagram'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingIndex === index}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleItemImageUpload(index, file, false);
                          }}
                        />
                      </label>

                      {item.image && (
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                          <img src={item.image} alt="Diagram" className="w-8 h-8 object-cover rounded" />
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{item.image}</span>
                          <button
                            type="button"
                            onClick={() => updateItemField(index, 'image', null)}
                            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ITEM BODY: MCQ */}
                {item.type === 'mcq' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        MCQ Question Text
                      </label>
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => updateItemField(index, 'text', e.target.value)}
                        rows="2"
                        placeholder="Enter the multiple choice question here..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* MCQ Options with Radio Button for Correct Answer */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                          Options (Select the radio button for the correct answer)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentOpts = item.options || [];
                            updateItemField(index, 'options', [...currentOpts, `Option ${currentOpts.length + 1}`]);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(item.options || []).map((opt, optIdx) => {
                          const isCorrect = (item.expected || '').trim().toLowerCase() === (opt || '').trim().toLowerCase();

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400/40'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`mcq_correct_${item.id}`}
                                checked={isCorrect}
                                onChange={() => updateItemField(index, 'expected', opt)}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                title="Set as correct answer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = [...(item.options || [])];
                                  const oldVal = nextOpts[optIdx];
                                  nextOpts[optIdx] = e.target.value;
                                  if (item.expected === oldVal) {
                                    updateItemField(index, 'expected', e.target.value);
                                  }
                                  updateItemField(index, 'options', nextOpts);
                                }}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 bg-transparent border-none text-xs sm:text-sm focus:outline-none font-medium text-slate-800"
                              />
                              {isCorrect && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full shrink-0">
                                  ✓ Correct
                                </span>
                              )}
                              {(item.options || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextOpts = (item.options || []).filter((_, i) => i !== optIdx);
                                    updateItemField(index, 'options', nextOpts);
                                    if (item.expected === opt) {
                                      updateItemField(index, 'expected', nextOpts[0] || '');
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                                  title="Remove option"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Diagram Image */}
                    <div className="pt-2 border-t border-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 shadow-sm">
                        <span>📷</span>
                        <span>{item.image ? 'Change Diagram' : '+ Add Question Diagram'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingIndex === index}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleItemImageUpload(index, file, false);
                          }}
                        />
                      </label>

                      {item.image && (
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                          <img src={item.image} alt="Diagram" className="w-8 h-8 object-cover rounded" />
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{item.image}</span>
                          <button
                            type="button"
                            onClick={() => updateItemField(index, 'image', null)}
                            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Insert Step Buttons */}
                <div className="mt-3 pt-2 border-t border-dashed border-slate-200/60 flex items-center justify-end gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Insert below:</span>
                  <button
                    type="button"
                    onClick={() => addRevisionCard(index + 1)}
                    className="text-[10px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shadow-2xs cursor-pointer"
                  >
                    + Revision Card
                  </button>
                  <button
                    type="button"
                    onClick={() => addDescriptiveQuestion(index + 1)}
                    className="text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs cursor-pointer"
                  >
                    + Descriptive Q
                  </button>
                  <button
                    type="button"
                    onClick={() => addMcqQuestion(index + 1)}
                    className="text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs cursor-pointer"
                  >
                    + MCQ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Save Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Make sure to click <strong>Save Exam Flow</strong> after adjusting cards or questions.
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving Exam...' : '💾 Save Exam Flow'}
        </button>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Bulk Add Revision Comic Cards
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Paste Cloudinary or web image URLs below, one per line. They will be added as revision cards at the end of the sequence (you can then move them anywhere).
            </p>
            <textarea
              value={bulkCardUrls}
              onChange={(e) => setBulkCardUrls(e.target.value)}
              rows="6"
              placeholder="https://res.cloudinary.com/.../card1.png&#10;https://res.cloudinary.com/.../card2.png"
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAddRevisionCards}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Add Cards to Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManager;
