import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import http from '../../services/apiClient';

const ExamManager = ({ chapterId, chapterTitle }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectKnowledge, setSubjectKnowledge] = useState('');
  const [questions, setQuestions] = useState([]);
  const [revisionCards, setRevisionCards] = useState([]);
  const [newCardLink, setNewCardLink] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
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
        setSubjectKnowledge(response.data.value.subjectKnowledge || '');
        setQuestions(response.data.value.questions || []);
        setRevisionCards(response.data.value.revisionCards || []);
      } else {
        setSubjectKnowledge('');
        setQuestions([]);
        setRevisionCards([]);
      }
    } catch (err) {
      // If it's a 404, it means it doesn't exist yet, which is fine
      if (err.response && err.response.status === 404) {
        setSubjectKnowledge('');
        setQuestions([]);
        setRevisionCards([]);
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
      await curriculumService.updateSetting({
        key: `exam_config_${chapterId}`,
        value: {
          subjectKnowledge,
          questions,
          revisionCards
        }
      });
      setSuccess('Exam configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save exam config', err);
      setError('Failed to save exam configuration.');
    }
    setSaving(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: '' }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    setError(null);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum file size is 50MB.`);
          continue;
        }
        const formData = new FormData();
        formData.append('image', file);
        const response = await http.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data && response.data.imageUrl) {
          uploadedUrls.push(response.data.imageUrl);
        }
      }
      if (uploadedUrls.length > 0) {
        setRevisionCards((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(`Failed to upload image: ${err.message || 'Network error'}`);
    }
    setUploadingImage(false);
  };

  const removeRevisionCard = (index) => {
    const newCards = [...revisionCards];
    newCards.splice(index, 1);
    setRevisionCards(newCards);
  };

  const moveRevisionCard = (index, direction) => {
    if (index + direction < 0 || index + direction >= revisionCards.length) return;
    const newCards = [...revisionCards];
    const temp = newCards[index];
    newCards[index] = newCards[index + direction];
    newCards[index + direction] = temp;
    setRevisionCards(newCards);
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading Exam Configuration...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">Exam Configuration</h3>
      <p className="text-sm text-gray-500 mb-6">Manage exam questions and AI subject knowledge context for <strong>{chapterTitle}</strong>.</p>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Subject Knowledge (AI Context)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Provide detailed context or specific syllabus constraints to guide the AI's evaluation.
        </p>
        <textarea
          value={subjectKnowledge}
          onChange={(e) => setSubjectKnowledge(e.target.value)}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g. Focus strictly on Newtonian mechanics. Do not consider quantum effects..."
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-bold text-gray-700">
            Descriptive Questions
          </label>
          <button
            onClick={addQuestion}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm flex items-center gap-1"
          >
            <span>+</span> Add Question
          </button>
        </div>
        
        {questions.length === 0 ? (
          <div className="p-4 bg-gray-50 text-gray-500 rounded-lg text-center text-sm border border-dashed border-gray-300">
            No questions added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, index) => (
              <div key={q.id || index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-500 mt-2">{index + 1}.</span>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(index, e.target.value)}
                  rows="2"
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Enter descriptive question..."
                />
                <button
                  onClick={() => removeQuestion(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove question"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-bold text-gray-700">
            Revision Cards (Comic Images)
          </label>
          <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            <input
              type="text"
              value={newCardLink}
              onChange={(e) => setNewCardLink(e.target.value)}
              placeholder="Paste Cloudinary URL..."
              className="flex-1 sm:w-64 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <button
              onClick={() => {
                if (newCardLink.trim()) {
                  setRevisionCards((prev) => [...prev, newCardLink.trim()]);
                  setNewCardLink('');
                }
              }}
              disabled={!newCardLink.trim()}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm disabled:opacity-50"
            >
              Add Link
            </button>
            
            {/* Keeping the file uploader as an alternative option */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={uploadingImage}
                className="px-3 py-1.5 bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center gap-1 disabled:opacity-50 h-full"
              >
                <span>{uploadingImage ? '...' : '+ File'}</span>
              </button>
            </div>
          </div>
        </div>

        {revisionCards.length === 0 ? (
          <div className="p-4 bg-gray-50 text-gray-500 rounded-lg text-center text-sm border border-dashed border-gray-300">
            No revision cards added yet. Paste Cloudinary image links to provide a quick revision before the exam.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {revisionCards.map((url, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img src={url} alt={`Revision Card ${index + 1}`} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <button
                      onClick={() => moveRevisionCard(index, -1)}
                      disabled={index === 0}
                      className="p-1 bg-white/20 text-white rounded hover:bg-white/40 disabled:opacity-30"
                    >
                      ◀
                    </button>
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                    <button
                      onClick={() => moveRevisionCard(index, 1)}
                      disabled={index === revisionCards.length - 1}
                      className="p-1 bg-white/20 text-white rounded hover:bg-white/40 disabled:opacity-30"
                    >
                      ▶
                    </button>
                  </div>
                  <button
                    onClick={() => removeRevisionCard(index)}
                    className="p-1.5 bg-red-500/80 text-white text-xs font-bold rounded hover:bg-red-500 mx-auto w-full"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default ExamManager;
