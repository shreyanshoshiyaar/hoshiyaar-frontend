import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';

const ExamManager = ({ chapterId, chapterTitle }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectKnowledge, setSubjectKnowledge] = useState('');
  const [questions, setQuestions] = useState([]);
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
      } else {
        setSubjectKnowledge('');
        setQuestions([]);
      }
    } catch (err) {
      // If it's a 404, it means it doesn't exist yet, which is fine
      if (err.response && err.response.status === 404) {
        setSubjectKnowledge('');
        setQuestions([]);
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
          questions
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
