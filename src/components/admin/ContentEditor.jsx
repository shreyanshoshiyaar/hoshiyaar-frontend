import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import http from '../../services/apiClient.js';

const ContentEditor = ({
  moduleId,
  moduleTitle,
  boardTitle,
  classTitle,
  subjectTitle,
  chapterId,
  chapterTitle,
}) => {
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [uploadingImages, setUploadingImages] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchItems();
    }
  }, [moduleId]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setShowScrollTop(y > 300);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchItems = async () => {
    if (!moduleId) return;
    try {
      setLoading(true);
      setError('');
      const response = await curriculumService.listItems(moduleId);
      const sortedItems = (response.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      // Ensure rearrange items have words initialized and descriptive items have modelAnswers
      const normalizedItems = sortedItems.map(item => {
        if (item.type === 'rearrange' && !Array.isArray(item.words)) {
          return { ...item, words: item.options || [], options: item.options || [] };
        }
        if (item.type === 'descriptive') {
          const mAnswers = Array.isArray(item.modelAnswers) ? item.modelAnswers : [];
          if (mAnswers.length === 0 && item.text) {
            mAnswers.push(item.text); // Backwards compatibility
          }
          const questionText = item.question || item.text || '';
          return { ...item, modelAnswers: mAnswers, question: questionText };
        }
        return item;
      });
      setItems(normalizedItems);
      setOriginalItems(JSON.parse(JSON.stringify(normalizedItems)));
      setHasUnsavedChanges(false);
      setSuccess('');
    } catch (err) {
      setError('Failed to fetch module content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const updateItemArray = (index, field, arrayIndex, value) => {
    const updated = [...items];
    const newArray = [...(updated[index][field] || [])];
    newArray[arrayIndex] = value;
    updated[index] = { ...updated[index], [field]: newArray };
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const addItemArrayElement = (index, field) => {
    const updated = [...items];
    const newArray = [...(updated[index][field] || []), ''];
    updated[index] = { ...updated[index], [field]: newArray };
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const removeItemArrayElement = (index, field, arrayIndex) => {
    const updated = [...items];
    const newArray = updated[index][field].filter((_, i) => i !== arrayIndex);
    updated[index] = { ...updated[index], [field]: newArray };
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const updateRearrangeWords = (index, newWords) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = updated[index] || {};
      updated[index] = {
        ...current,
        words: [...newWords],
        options: [...newWords],
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const updateKeywords = (index, keywords) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = updated[index] || {};
      updated[index] = {
        ...current,
        keywords: [...keywords],
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const changeItemType = (index, newType) => {
    const updated = [...items];
    const oldItem = updated[index];

    // Build new item with only fields relevant to the new type
    const baseItem = {
      _id: oldItem._id,
      itemId: oldItem.itemId || '',
      type: newType,
      order: oldItem.order || index + 1,
      imageUrl: oldItem.imageUrl,
      images: oldItem.images || [],
      explanation: oldItem.explanation || '',
      onWrong: oldItem.onWrong || '',
    };

    let newItem;
    if (['statement', 'concept', 'video'].includes(newType)) {
      newItem = {
        ...baseItem,
        text: oldItem.text || oldItem.question || '',
        title: oldItem.title || '',
        question: oldItem.question || oldItem.videoUrl || '',
        videoUrl: oldItem.videoUrl || oldItem.question || '',
      };
    } else if (newType === 'comic') {
      newItem = {
        ...baseItem,
        speaker: oldItem.speaker || 'Narration',
        text: oldItem.text || '',
        images: oldItem.images || (oldItem.imageUrl ? [oldItem.imageUrl] : []),
      };
    } else if (newType === 'story') {
      newItem = {
        ...baseItem,
        speaker: oldItem.speaker || 'Dr. Sharma',
        text: oldItem.text || oldItem.question || '',
        mood: oldItem.mood || 'neutral',
      };
    } else if (newType === 'blackboard') {
      newItem = {
        ...baseItem,
        cardTitle: oldItem.cardTitle || oldItem.question || '',
        speaker: oldItem.speaker || 'Dr. Sharma',
        text: oldItem.text || '',
        glyphCode: oldItem.glyphCode || oldItem.answer || '',
        lineIndex: oldItem.lineIndex || 1,
        inputJson: oldItem.inputJson || null,
      };
    } else if (newType === 'engagement-audio') {
      newItem = {
        ...baseItem,
        question: oldItem.question || oldItem.text || '',
        targetWord: oldItem.targetWord || '',
        pronunciation: oldItem.pronunciation || '',
        speaker: oldItem.speaker || 'Dr. Sharma',
      };
    } else if (newType === 'didyouknow') {
      newItem = {
        ...baseItem,
        cardTitle: oldItem.cardTitle || 'Did you know?',
        text: oldItem.text || oldItem.question || '',
      };
    } else if (newType === 'multiple-choice') {
      newItem = {
        ...baseItem,
        question: oldItem.question || '',
        options: oldItem.options || ['', ''],
        answer: oldItem.answer || '',
      };
    } else if (newType === 'fill-in-the-blank') {
      newItem = {
        ...baseItem,
        question: oldItem.question || '',
        answer: oldItem.answer || '',
      };
    } else if (newType === 'rearrange') {
      // Convert old options to words if available, otherwise use existing words
      const wordsArray = Array.isArray(oldItem.words) ? oldItem.words :
        (Array.isArray(oldItem.options) ? oldItem.options : []);
      newItem = {
        ...baseItem,
        question: oldItem.question || '',
        words: wordsArray,
        options: wordsArray, // Keep options in sync with words
        answer: oldItem.answer || '',
      };
    } else if (newType === 'descriptive') {
      newItem = {
        ...baseItem,
        question: oldItem.question || '',
        keywords: oldItem.keywords || (oldItem.answer ? String(oldItem.answer).split(',').map(s => s.trim()).filter(Boolean) : []),
        modelAnswers: oldItem.modelAnswers || (oldItem.text ? [oldItem.text] : []),
      };
    } else {
      newItem = baseItem;
    }

    updated[index] = newItem;
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const addNewItem = () => {
    const lastItem = items[items.length - 1];
    const newOrder = lastItem ? (lastItem.order || 0) + 1024 : 1024;
    const newItem = {
      _id: `new-${Date.now()}`,
      type: 'concept',
      text: '',
      order: newOrder,
    };
    setItems([...items, newItem]);
    setHasUnsavedChanges(true);
  };

  const removeItem = (index) => {
    const confirmMessage = `Are you sure you want to remove this item?\n\nNote: This change will NOT be saved to the database until you click "Save Changes".\n\nClick "Discard Changes" to reload from database if you want to cancel.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const discardChanges = () => {
    if (!hasUnsavedChanges) return;

    const confirmMessage = 'Are you sure you want to discard all unsaved changes? This will reload the content from the database.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setItems(JSON.parse(JSON.stringify(originalItems)));
    setHasUnsavedChanges(false);
    setError('');
    setSuccess('');
    setWarnings([]);
    setUploadingImages({});
  };

  const moveItemUp = (index) => {
    if (index === 0) return;
    const updated = [...items];
    const current = updated[index];
    const prev = updated[index - 1];
    
    // Calculation: Midpoint between prev.order and its predecessor
    let newOrder;
    if (index === 1) {
      newOrder = (prev.order || 1024) / 2;
    } else {
      const pred = updated[index - 2];
      newOrder = ((pred.order || 0) + (prev.order || 0)) / 2;
    }
    
    current.order = newOrder;
    
    // Swap position in array and re-sort to be safe
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const sorted = updated.sort((a,b) => (a.order || 0) - (b.order || 0));
    
    setItems(sorted);
    setHasUnsavedChanges(true);
  };

  const moveItemDown = (index) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    const current = updated[index];
    const next = updated[index + 1];
    
    // Calculation: Midpoint between next.order and its successor
    let newOrder;
    if (index === items.length - 2) {
      newOrder = (next.order || 1024) + 1024;
    } else {
      const succ = updated[index + 2];
      newOrder = ((next.order || 0) + (succ.order || 0)) / 2;
    }
    
    current.order = newOrder;
    
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const sorted = updated.sort((a,b) => (a.order || 0) - (b.order || 0));
    
    setItems(sorted);
    setHasUnsavedChanges(true);
  };

  const updateOrder = (index, newOrderStr) => {
    const newOrder = parseFloat(newOrderStr);
    if (isNaN(newOrder)) return;

    const updated = [...items];
    updated[index].order = newOrder;
    
    const sorted = updated.sort((a,b) => (a.order || 0) - (b.order || 0));
    setItems(sorted);
    setHasUnsavedChanges(true);
  };

  const handleImageUpload = async (itemIndex, file, isMultiple = false) => {
    try {
      setUploadingImages({ ...uploadingImages, [itemIndex]: true });

      // If uploading multiple files, upload them one at a time to avoid 413 errors
      if (isMultiple && Array.isArray(file) && file.length > 1) {
        const uploadedUrls = [];
        for (const singleFile of file) {
          try {
            const formData = new FormData();
            formData.append('file', singleFile);
            formData.append('folder', 'hoshiyaar');

            const response = await http.post('/api/upload/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            const imageUrl = response.data.url || response.data.secure_url;
            if (imageUrl) {
              uploadedUrls.push(imageUrl);
            }
          } catch (singleErr) {
            if (singleErr.response?.status === 413) {
              setError(`File "${singleFile.name}" is too large. Maximum size is 50MB per file.`);
            } else {
              console.error('Error uploading file:', singleFile.name, singleErr);
            }
          }
        }

        if (uploadedUrls.length > 0) {
          const updated = [...items];
          const existingImages = updated[itemIndex].images || [];
          updated[itemIndex] = {
            ...updated[itemIndex],
            images: [...existingImages, ...uploadedUrls].filter(Boolean),
          };
          setItems(updated);
          setHasUnsavedChanges(true);
        }
        setUploadingImages({ ...uploadingImages, [itemIndex]: false });
        return;
      }

      // Single file or single-item multiple upload
      const formData = new FormData();

      if (isMultiple && Array.isArray(file)) {
        file.forEach(f => formData.append('files', f));
      } else {
        formData.append('file', file);
      }

      formData.append('folder', 'hoshiyaar');

      const endpoint = isMultiple && Array.isArray(file)
        ? '/api/upload/images'
        : '/api/upload/image';

      const response = await http.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const updated = [...items];

      if (isMultiple && Array.isArray(file) && response.data.images) {
        const existingImages = updated[itemIndex].images || [];
        const newImages = response.data.images.map(img => img.url || img.secure_url);
        updated[itemIndex] = {
          ...updated[itemIndex],
          images: [...existingImages, ...newImages].filter(Boolean),
        };
      } else {
        const fileUrl = response.data.url || response.data.secure_url;
        const isVideo = fileUrl.match(/\.(mp4|mov|webm)$/i) || updated[itemIndex].type === 'video';
        
        if (isVideo) {
          updated[itemIndex] = {
            ...updated[itemIndex],
            videoUrl: fileUrl,
          };
          if (updated[itemIndex].type === 'video') {
            updated[itemIndex].question = fileUrl;
          }
        } else {
          updated[itemIndex] = {
            ...updated[itemIndex],
            imageUrl: fileUrl,
          };
        }
      }

      setItems(updated);
      setHasUnsavedChanges(true);
      setUploadingImages({ ...uploadingImages, [itemIndex]: false });
    } catch (err) {
      if (err.response?.status === 413) {
        setError('Upload failed: File(s) too large. Maximum file size is 50MB per file. Try uploading images one at a time or reduce image sizes.');
      } else if (err.response?.status) {
        setError(`Failed to upload image: ${err.response?.data?.message || `Server error ${err.response.status}`}`);
      } else {
        setError(`Failed to upload image: ${err.message || 'Network error'}`);
      }
      setUploadingImages({ ...uploadingImages, [itemIndex]: false });
    }
  };

  const handleImageUrlInput = (itemIndex, url, isMultiple = false, imageIndex = null) => {
    const updated = [...items];

    if (isMultiple) {
      const images = [...(updated[itemIndex].images || [])];
      if (imageIndex !== null) {
        images[imageIndex] = url;
      } else {
        images.push(url);
      }
      updated[itemIndex] = { ...updated[itemIndex], images: images.filter(Boolean) };
    } else {
      const isVideo = url.match(/\.(mp4|mov|webm)$/i) || updated[itemIndex].type === 'video';
      if (isVideo) {
        updated[itemIndex] = { ...updated[itemIndex], videoUrl: url };
        if (updated[itemIndex].type === 'video') {
          updated[itemIndex].question = url;
        }
      } else {
        updated[itemIndex] = { ...updated[itemIndex], imageUrl: url };
      }
    }

    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const removeImage = (itemIndex, imageIndex = null, isMultiple = false) => {
    const updated = [...items];

    if (isMultiple) {
      const images = [...(updated[itemIndex].images || [])];
      images.splice(imageIndex, 1);
      updated[itemIndex] = { ...updated[itemIndex], images: images };
    } else {
      updated[itemIndex] = { ...updated[itemIndex], imageUrl: '', videoUrl: '' };
      if (updated[itemIndex].type === 'video') {
        updated[itemIndex].question = '';
      }
    }

    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!moduleId || !moduleTitle) {
      setError('Module information is missing');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      setWarnings([]);

      const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

      const concepts = sortedItems.map((item) => {
        const concept = {
          type: item.type,
        };

        // Include _id if it exists and is not a temporary new item ID
        const mongoId = item._id ? String(item._id) : null;
        if (mongoId && !mongoId.startsWith('new-')) {
          concept._id = mongoId;
        }

        if (item.itemId) concept.itemId = item.itemId;
        if (item.explanation) concept.explanation = item.explanation;
        if (item.onWrong) concept.onWrong = item.onWrong;
        if (item.hint) concept.hint = item.hint;
        if (item.speaker) concept.speaker = item.speaker;
        if (item.mood) concept.mood = item.mood;

        if (['statement', 'concept', 'video'].includes(item.type)) {
          concept.text = item.text || '';
          if (item.title) concept.title = item.title;
          if (item.type === 'video') {
            concept.question = item.question || item.videoUrl || '';
            concept.videoUrl = item.question || item.videoUrl || '';
          } else {
            if (item.question) concept.question = item.question;
          }
        } else if (item.type === 'comic') {
          concept.speaker = item.speaker || 'Narration';
          concept.text = item.text || '';
          concept.images = item.images || [];
          concept.imageUrl = item.imageUrl || '';
        } else if (item.type === 'story') {
          concept.speaker = item.speaker || 'Dr. Sharma';
          concept.text = item.text || '';
          concept.mood = item.mood || 'neutral';
          concept.images = item.images || [];
          concept.imageUrl = item.imageUrl || '';
        } else if (item.type === 'blackboard') {
          concept.cardTitle = item.cardTitle || item.question || '';
          concept.glyphCode = item.glyphCode || item.answer || '';
          concept.speaker = item.speaker || 'Dr. Sharma';
          concept.text = item.text || '';
          concept.question = item.cardTitle || item.question || '';
          concept.answer = item.glyphCode || item.answer || '';
          concept.lineIndex = item.lineIndex || 1;
          if (item.inputJson) {
            concept.inputJson = typeof item.inputJson === 'string' ? (() => { try { return JSON.parse(item.inputJson); } catch { return item.inputJson; } })() : item.inputJson;
          }
        } else if (item.type === 'engagement-audio') {
          concept.question = item.question || item.text || '';
          concept.text = item.text || item.question || '';
          concept.targetWord = item.targetWord || item.answer || '';
          concept.pronunciation = item.pronunciation || '';
          concept.speaker = item.speaker || 'Dr. Sharma';
        } else if (item.type === 'didyouknow') {
          concept.cardTitle = item.cardTitle || 'Did you know?';
          concept.text = item.text || item.question || '';
          concept.question = item.cardTitle || 'Did you know?';
          concept.imageUrl = item.imageUrl || '';
        } else if (item.type === 'multiple-choice') {
          concept.question = item.question || '';
          concept.options = (item.options || []).filter(Boolean);
          concept.answer = item.answer || '';
        } else if (item.type === 'fill-in-the-blank') {
          concept.question = item.question || '';
          concept.answer = item.answer || '';
        } else if (item.type === 'rearrange') {
          concept.question = item.question || '';
          concept.words = item.words || [];
          concept.options = item.words || [];
          concept.answer = item.answer || '';
        } else if (item.type === 'descriptive') {
          concept.question = item.question || '';
          concept.keywords = item.keywords || [];
          concept.modelAnswers = item.modelAnswers || [];
        }

        if (item.imageUrl) {
          concept.imageUrl = item.imageUrl;
        }
        if (item.images && item.images.length > 0) {
          concept.images = item.images.filter(Boolean);
        }

        return concept;
      });

      const payload = {
        board_title: boardTitle,
        class_title: classTitle,
        subject_title: subjectTitle,
        chapter_title: chapterTitle,
        module_id: moduleId, // Pass the actual module ID to ensure we use the correct module
        replace: true, // ensure we don't end up with duplicates
        lessons: [
          {
            lesson_title: moduleTitle,
            concepts: concepts,
          },
        ],
      };

      console.log('[ContentEditor] Sending payload with', concepts.length, 'concepts');
      console.log('[ContentEditor] Concepts with _id:', concepts.filter(c => c._id).map(c => ({ _id: c._id, type: c.type })));
      console.log('[ContentEditor] Full payload:', JSON.stringify(payload, null, 2));

      const response = await http.post('/api/curriculum/import', payload);

      console.log('[ContentEditor] Save response:', response.data);

      // Check if items were actually updated or if new ones were created
      const importedCount = response.data.importedItems || 0;
      const skippedCount = response.data.skipped || 0;
      const resWarnings = response.data.warnings || [];

      if (importedCount === concepts.length && skippedCount === 0 && resWarnings.length === 0) {
        setSuccess(`Successfully saved! ${importedCount} items imported.`);
      } else {
        setSuccess(`Saved with warnings: ${importedCount} items imported, ${skippedCount} skipped.`);
        if (resWarnings.length > 0) {
          setWarnings(resWarnings);
        }
      }

      setHasUnsavedChanges(false);

      // Clear the front-end cache so fetchItems retrieves fresh data
      curriculumService.clearCache();

      setTimeout(() => {
        fetchItems();
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save changes';
      setError(errorMsg);
      console.error('[ContentEditor] Save error:', err);
      console.error('[ContentEditor] Error response:', err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading module content...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Content: {moduleTitle}
          </h2>
          {hasUnsavedChanges && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ You have unsaved changes. Click "Save Changes" to update the database.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={discardChanges}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={addNewItem}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            + Add New Item
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!hasUnsavedChanges && items.length === originalItems.length)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p>{success}</p>
          {warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-300 text-sm text-amber-700">
              <p className="font-semibold mb-1">Warnings during import (auto-fixed):</p>
              <ul className="list-disc pl-5 space-y-1">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-600 mb-4">No content items found. Click "Add New Item" to create content.</p>
      ) : (
        <div className="space-y-4">
          {[...items].sort((a, b) => (a.order || 0) - (b.order || 0)).map((item, index) => {
            const originalIndex = items.findIndex(i => (i._id || '') === (item._id || ''));
            const actualIndex = originalIndex >= 0 ? originalIndex : index;

            return (
              <div key={item._id || actualIndex} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-sm font-medium text-gray-700">Type:</label>
                    <select
                      value={item.type || 'concept'}
                      onChange={(e) => changeItemType(actualIndex, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="concept">Concept</option>
                      <option value="statement">Statement</option>
                      <option value="story">Story / Dialogue</option>
                      <option value="comic">Comic Scene</option>
                      <option value="blackboard">Blackboard (Board Time)</option>
                      <option value="engagement-audio">Voice Engagement (Say Aloud)</option>
                      <option value="didyouknow">Did You Know (Flip Card)</option>
                      <option value="multiple-choice">MCQ</option>
                      <option value="fill-in-the-blank">Fill in the Blank</option>
                      <option value="rearrange">Rearrange</option>
                      <option value="descriptive">Descriptive Question</option>
                      <option value="video">Video</option>
                    </select>

                    {/* Order Controls */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Order:</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveItemUp(actualIndex)}
                          disabled={actualIndex === 0}
                          className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <div className="w-8 flex items-center justify-center font-bold text-gray-700 text-sm">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => moveItemDown(actualIndex)}
                          disabled={actualIndex === items.length - 1}
                          className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">({items.length} total)</span>
                    </div>

                    {/* Item ID / Tag Input */}
                    <div className="flex items-center gap-1.5 ml-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Tag / ID:</label>
                      <input
                        type="text"
                        value={item.itemId || ''}
                        onChange={(e) => updateItem(actualIndex, 'itemId', e.target.value)}
                        placeholder="e.g. C1_S1, Q1"
                        className="px-2 py-0.5 text-xs font-mono bg-gray-50 border border-gray-300 rounded text-gray-700 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="Curriculum ID linking to Excel/CSV sheet"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(actualIndex)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Concept / Statement / Video Type */}
                {['statement', 'concept', 'video'].includes(item.type) && (
                  <div className="space-y-3">
                    {item.type !== 'statement' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => updateItem(actualIndex, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={`Enter ${item.type} title...`}
                        />
                      </div>
                    )}
                    
                    {item.type === 'video' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video URL (YouTube)
                        </label>
                        <input
                          type="text"
                          value={item.question || item.videoUrl || ''}
                          onChange={(e) => {
                            updateItem(actualIndex, 'question', e.target.value);
                            updateItem(actualIndex, 'videoUrl', e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter YouTube URL..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Content
                      </label>
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => updateItem(actualIndex, 'text', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter text..."
                      />
                    </div>

                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Multiple Choice Type */}
                {item.type === 'multiple-choice' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>
                      <input
                        type="text"
                        value={item.question || ''}
                        onChange={(e) => updateItem(actualIndex, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter question..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      {(item.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2 mb-2">
                          <input
                            type="radio"
                            checked={item.answer === option}
                            onChange={() => updateItem(actualIndex, 'answer', option)}
                            className="mt-2"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateItemArray(actualIndex, 'options', optIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <button
                            onClick={() => removeItemArrayElement(actualIndex, 'options', optIndex)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addItemArrayElement(actualIndex, 'options')}
                        className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          💡 Explanation (shown after student answers)
                        </label>
                        <textarea
                          value={item.explanation || ''}
                          onChange={(e) => updateItem(actualIndex, 'explanation', e.target.value)}
                          rows={2}
                          placeholder="e.g. Peristalsis is the wave-like contraction of muscles..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          🛡️ Hint / On Wrong Guidance
                        </label>
                        <textarea
                          value={item.onWrong || ''}
                          onChange={(e) => updateItem(actualIndex, 'onWrong', e.target.value)}
                          rows={2}
                          placeholder="e.g. Think about how food moves smoothly down the esophagus!"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Fill in the Blank Type */}
                {item.type === 'fill-in-the-blank' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>
                      <input
                        type="text"
                        value={item.question || ''}
                        onChange={(e) => updateItem(actualIndex, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter question with blank..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        value={item.answer || ''}
                        onChange={(e) => updateItem(actualIndex, 'answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter correct answer..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          💡 Explanation (shown after student answers)
                        </label>
                        <textarea
                          value={item.explanation || ''}
                          onChange={(e) => updateItem(actualIndex, 'explanation', e.target.value)}
                          rows={2}
                          placeholder="e.g. Explanation of why this answer is correct..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          🛡️ Hint / On Wrong Guidance
                        </label>
                        <textarea
                          value={item.onWrong || ''}
                          onChange={(e) => updateItem(actualIndex, 'onWrong', e.target.value)}
                          rows={2}
                          placeholder="e.g. Look closely at the clue in the question..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Rearrange Type */}
                {item.type === 'rearrange' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>
                      <input
                        type="text"
                        value={item.question || ''}
                        onChange={(e) => updateItem(actualIndex, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter question..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Words/Phrases to Rearrange
                      </label>
                      {(item.words || []).map((word, wordIndex) => (
                        <div key={wordIndex} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={word}
                            onChange={(e) => {
                              const currentItem = items[actualIndex];
                              const currentWords = Array.isArray(currentItem?.words) ? currentItem.words : [];
                              const newWords = [...currentWords];
                              newWords[wordIndex] = e.target.value;
                              updateRearrangeWords(actualIndex, newWords);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={`Word/Phrase ${wordIndex + 1}`}
                          />
                          <button
                            onClick={() => {
                              const currentItem = items[actualIndex];
                              const currentWords = Array.isArray(currentItem?.words) ? currentItem.words : [];
                              const newWords = currentWords.filter((_, i) => i !== wordIndex);
                              updateRearrangeWords(actualIndex, newWords);
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const currentItem = items[actualIndex];
                          const currentWords = Array.isArray(currentItem?.words) ? currentItem.words : [];
                          const newWords = [...currentWords, ''];
                          updateRearrangeWords(actualIndex, newWords);
                        }}
                        className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        + Add Word/Phrase
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer (comma-separated or space-separated)
                      </label>
                      <input
                        type="text"
                        value={item.answer || ''}
                        onChange={(e) => updateItem(actualIndex, 'answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter correct answer sequence..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          💡 Explanation (shown after student answers)
                        </label>
                        <textarea
                          value={item.explanation || ''}
                          onChange={(e) => updateItem(actualIndex, 'explanation', e.target.value)}
                          rows={2}
                          placeholder="e.g. The correct sequence follows the order of organs in digestion..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          🛡️ Hint / On Wrong Guidance
                        </label>
                        <textarea
                          value={item.onWrong || ''}
                          onChange={(e) => updateItem(actualIndex, 'onWrong', e.target.value)}
                          rows={2}
                          placeholder="e.g. Start from what happens first when you chew!"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Descriptive Type */}
                {item.type === 'descriptive' && (
                  <div className="space-y-4 p-4 bg-indigo-50/30 rounded-lg border border-indigo-100">
                    <div>
                      <label className="block text-sm font-bold text-indigo-900 mb-2">
                        Step 1: The Question
                      </label>
                      <textarea
                        value={item.question || ''}
                        onChange={(e) => updateItem(actualIndex, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="Type the subjective question here..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-indigo-900 mb-2">
                        Step 2: Accuracy Matching Keywords
                      </label>
                      <div className="bg-white p-3 rounded-md border border-gray-300">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(item.keywords || []).map((keyword, kwIndex) => (
                            <span key={kwIndex} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
                              {keyword}
                              <button
                                onClick={() => {
                                  const newKeywords = (item.keywords || []).filter((_, i) => i !== kwIndex);
                                  updateKeywords(actualIndex, newKeywords);
                                }}
                                className="ml-1.5 inline-flex items-center justify-center hover:text-red-200 focus:outline-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {(item.keywords || []).length === 0 && (
                            <span className="text-xs text-gray-400 italic">No keywords added. Type below and press Add or Enter.</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a required keyword (e.g. chloroplast)"
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value) {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val && !(item.keywords || []).includes(val)) {
                                  updateKeywords(actualIndex, [...(item.keywords || []), val]);
                                }
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousSibling;
                              const val = input.value.trim();
                              if (val && !(item.keywords || []).includes(val)) {
                                updateKeywords(actualIndex, [...(item.keywords || []), val]);
                                input.value = '';
                              }
                            }}
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            Add
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-600">
                          <strong>How it works:</strong> The student must include most of these words in their answer to get marks. Matching is case-insensitive.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-indigo-900 mb-2">
                        Step 3: Model Answers (Up to 4 variations)
                      </label>
                      <div className="bg-white p-3 rounded-md border border-gray-300 space-y-3">
                        <p className="text-xs text-gray-500 italic pb-2 border-b border-gray-100">
                          Provide different ways to write the correct answer. The student will see these as "Model Answers" after submitting.
                        </p>
                        {(item.modelAnswers || []).map((ans, ansIdx) => (
                          <div key={ansIdx} className="flex gap-2">
                            <textarea
                              value={ans}
                              onChange={(e) => {
                                const newArray = [...(item.modelAnswers || [])];
                                newArray[ansIdx] = e.target.value;
                                updateItem(actualIndex, 'modelAnswers', newArray);
                              }}
                              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-blue-50/50 text-sm"
                              placeholder={`Model Answer Variation ${ansIdx + 1}...`}
                              rows={2}
                            />
                            <button
                              onClick={() => {
                                const newArray = (item.modelAnswers || []).filter((_, i) => i !== ansIdx);
                                updateItem(actualIndex, 'modelAnswers', newArray);
                              }}
                              className="px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded self-start h-10 flex items-center justify-center font-bold"
                              title="Remove Answer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        
                        {(item.modelAnswers || []).length < 4 && (
                          <button
                            onClick={() => {
                              const newArray = [...(item.modelAnswers || []), ''];
                              updateItem(actualIndex, 'modelAnswers', newArray);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            + Add another acceptable answer format
                          </button>
                        )}
                        
                        {(item.modelAnswers || []).length >= 4 && (
                          <p className="text-xs text-orange-500 font-medium">Maximum 4 model answers allowed.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          💡 Explanation (shown after student answers)
                        </label>
                        <textarea
                          value={item.explanation || ''}
                          onChange={(e) => updateItem(actualIndex, 'explanation', e.target.value)}
                          rows={2}
                          placeholder="e.g. A comprehensive explanation covering all key concepts..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          🛡️ Hint / On Wrong Guidance
                        </label>
                        <textarea
                          value={item.onWrong || ''}
                          onChange={(e) => updateItem(actualIndex, 'onWrong', e.target.value)}
                          rows={2}
                          placeholder="e.g. Make sure to mention all the required keywords above!"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Comic Slides Type */}
                {item.type === 'comic' && (
                  <div className="space-y-3 p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                    <div className="flex gap-4 flex-wrap">
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Speaker / Character
                        </label>
                        <input
                          type="text"
                          value={item.speaker || 'Narration'}
                          onChange={(e) => updateItem(actualIndex, 'speaker', e.target.value)}
                          placeholder="e.g. Narration, Dr. Sharma, Hoshi"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          Scene Narration / Caption
                        </label>
                        <input
                          type="text"
                          value={item.text || ''}
                          onChange={(e) => updateItem(actualIndex, 'text', e.target.value)}
                          placeholder="e.g. Dr. Sharma gathers the students at the camp entrance..."
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-amber-800 bg-amber-100/70 p-2.5 rounded-md border border-amber-200">
                      💡 <strong>Comic Slide:</strong> Upload or paste comic artwork below. Caption text is spoken by the narrator/character.
                    </div>
                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Story / Character Dialogue Type */}
                {item.type === 'story' && (
                  <div className="space-y-3 p-4 bg-purple-50/50 rounded-xl border border-purple-200">
                    <div className="flex gap-4 flex-wrap">
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-purple-900 uppercase mb-1">
                          Speaker
                        </label>
                        <input
                          type="text"
                          value={item.speaker || 'Dr. Sharma'}
                          onChange={(e) => updateItem(actualIndex, 'speaker', e.target.value)}
                          placeholder="e.g. Dr. Sharma, Hoshi, Myra"
                          className="w-full px-3 py-2 bg-white border border-purple-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-purple-900 uppercase mb-1">
                          Character Mood / Expression
                        </label>
                        <select
                          value={item.mood || 'neutral'}
                          onChange={(e) => updateItem(actualIndex, 'mood', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-purple-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="neutral">Neutral / Normal</option>
                          <option value="happy">Happy / Smiling 😊</option>
                          <option value="curious">Curious / Inquiring 🤔</option>
                          <option value="thinking">Thinking / Pondering 💭</option>
                          <option value="excited">Excited / Amazed 😃</option>
                          <option value="explaining">Explaining / Teaching 🧑‍🏫</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-900 uppercase mb-1">
                        Dialogue Line
                      </label>
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => updateItem(actualIndex, 'text', e.target.value)}
                        rows={2}
                        placeholder="e.g. Look at that! The nutrients are entering the blood vessels..."
                        className="w-full px-3 py-2 bg-white border border-purple-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Blackboard (Board Time) Type */}
                {item.type === 'blackboard' && (
                  <div className="space-y-3 p-4 bg-slate-900 text-white rounded-xl border border-slate-700">
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          Card / Batch Title
                        </label>
                        <input
                          type="text"
                          value={item.cardTitle || item.question || ''}
                          onChange={(e) => {
                            updateItem(actualIndex, 'cardTitle', e.target.value);
                            updateItem(actualIndex, 'question', e.target.value);
                          }}
                          placeholder="e.g. Teeth crush and chew food"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          Speaker / Voice
                        </label>
                        <input
                          type="text"
                          value={item.speaker || 'Dr. Sharma'}
                          onChange={(e) => updateItem(actualIndex, 'speaker', e.target.value)}
                          placeholder="e.g. Dr. Sharma"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-full md:w-24">
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                          Line #
                        </label>
                        <input
                          type="number"
                          value={item.lineIndex || 1}
                          onChange={(e) => updateItem(actualIndex, 'lineIndex', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Spoken Narration Text
                      </label>
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => updateItem(actualIndex, 'text', e.target.value)}
                        rows={2}
                        placeholder="e.g. Teeth CRUSH and chew food into small pieces."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Blackboard Glyph Code
                      </label>
                      <input
                        type="text"
                        value={item.glyphCode || item.answer || ''}
                        onChange={(e) => {
                          updateItem(actualIndex, 'glyphCode', e.target.value);
                          updateItem(actualIndex, 'answer', e.target.value);
                        }}
                        placeholder="e.g. chapati -> teeth -> tiny pieces"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md font-mono text-cyan-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tokens: chapati, teeth, saliva, stomach, tiny pieces (use -&gt; for arrows).
                      </p>
                    </div>

                    {/* Collapsible Vector Diagram Actions JSON */}
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-semibold text-slate-400 hover:text-cyan-300 transition-colors py-1">
                        ⚙️ Advanced: Vector Diagram Actions (inputJson drawing commands)
                      </summary>
                      <div className="mt-2">
                        <textarea
                          value={typeof item.inputJson === 'object' && item.inputJson !== null ? JSON.stringify(item.inputJson, null, 2) : (item.inputJson || '')}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              updateItem(actualIndex, 'inputJson', parsed);
                            } catch {
                              updateItem(actualIndex, 'inputJson', e.target.value);
                            }
                          }}
                          rows={4}
                          placeholder='[{"action": "drawGlyph", "code": "teeth", "x": 100, "y": 80}]'
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded font-mono text-cyan-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Paste valid JSON array of drawing actions. If empty, glyph code will be used automatically.
                        </p>
                      </div>
                    </details>
                  </div>
                )}

                {/* Voice Engagement (Say Aloud) Type */}
                {item.type === 'engagement-audio' && (
                  <div className="space-y-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <div className="flex gap-4 flex-wrap">
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">
                          Speaker / Voice
                        </label>
                        <input
                          type="text"
                          value={item.speaker || 'Dr. Sharma'}
                          onChange={(e) => updateItem(actualIndex, 'speaker', e.target.value)}
                          placeholder="e.g. Dr. Sharma"
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">
                          Target Word to Speak
                        </label>
                        <input
                          type="text"
                          value={item.targetWord || item.answer || ''}
                          onChange={(e) => {
                            updateItem(actualIndex, 'targetWord', e.target.value);
                            updateItem(actualIndex, 'answer', e.target.value);
                          }}
                          placeholder="e.g. PERISTALSIS"
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md font-bold text-emerald-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">
                          Pronunciation Guide
                        </label>
                        <input
                          type="text"
                          value={item.pronunciation || ''}
                          onChange={(e) => updateItem(actualIndex, 'pronunciation', e.target.value)}
                          placeholder="e.g. peh-rih-STALL-sis"
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">
                        Spoken Instruction / Prompt
                      </label>
                      <textarea
                        value={item.question || item.text || ''}
                        onChange={(e) => {
                          updateItem(actualIndex, 'question', e.target.value);
                          updateItem(actualIndex, 'text', e.target.value);
                        }}
                        rows={2}
                        placeholder="e.g. Say aloud with me: PERISTALSIS!"
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <ImageEditor
                      item={item}
                      index={actualIndex}
                      handleImageUpload={handleImageUpload}
                      handleImageUrlInput={handleImageUrlInput}
                      removeImage={removeImage}
                      uploading={uploadingImages[actualIndex]}
                    />
                  </div>
                )}

                {/* Did You Know Type */}
                {item.type === 'didyouknow' && (
                  <div className="space-y-3 bg-blue-50 border border-blue-200 p-4 rounded-lg mt-3">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Front Card Title
                      </label>
                      <input
                        type="text"
                        value={item.cardTitle || 'Did you know?'}
                        onChange={(e) => updateItem(actualIndex, 'cardTitle', e.target.value)}
                        placeholder="e.g. Did you know?"
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Back Card Fact Content
                      </label>
                      <textarea
                        value={item.text || item.question || ''}
                        onChange={(e) => {
                          updateItem(actualIndex, 'text', e.target.value);
                          updateItem(actualIndex, 'question', e.target.value);
                        }}
                        rows={3}
                        placeholder="e.g. The Charaka Samhita is a very old Ayurvedic book..."
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Fact Illustration Image URL
                      </label>
                      <input
                        type="text"
                        value={item.imageUrl || ''}
                        onChange={(e) => updateItem(actualIndex, 'imageUrl', e.target.value)}
                        placeholder="https://res.cloudinary.com/... or image URL"
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          ↑ Back to Top
        </button>
      )}
    </div>
  );
};

// Image Editor Component
const ImageEditor = ({ item, index, handleImageUpload, handleImageUrlInput, removeImage, uploading }) => {
  const fileInputRef = React.useRef(null);
  const multipleFileInputRef = React.useRef(null);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Media (Images / Videos)
      </label>

      {/* Single Image (imageUrl) */}
      <div className="mb-4">
        <div className="text-xs text-gray-600 mb-2">Single Media (Primary)</div>
        {item.imageUrl && (
          <div className="mb-2 relative inline-block">
            <img
              src={item.imageUrl}
              alt="Preview"
              className="h-24 w-auto rounded border border-gray-300"
            />
            <button
              onClick={() => removeImage(index, null, false)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        {item.videoUrl && (
          <div className="mb-2 relative inline-block">
            <video
              src={item.videoUrl}
              controls
              className="h-32 w-auto rounded border border-gray-300"
            />
            <button
              onClick={() => removeImage(index, null, false)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={item.imageUrl || item.videoUrl || ''}
            onChange={(e) => handleImageUrlInput(index, e.target.value, false)}
            placeholder="Paste media URL here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files[0]) {
                handleImageUpload(index, e.target.files[0], false);
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Multiple Images (images array) */}
      <div>
        <div className="text-xs text-gray-600 mb-2">Multiple Images</div>
        {item.images && item.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {item.images.map((imgUrl, imgIndex) => (
              <div key={imgIndex} className="relative">
                <img
                  src={imgUrl}
                  alt={`Image ${imgIndex + 1}`}
                  className="h-24 w-full object-cover rounded border border-gray-300"
                />
                <button
                  onClick={() => removeImage(index, imgIndex, true)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Paste image URL and press Enter..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                handleImageUrlInput(index, e.target.value, true);
                e.target.value = '';
              }
            }}
            onBlur={(e) => {
              if (e.target.value) {
                handleImageUrlInput(index, e.target.value, true);
                e.target.value = '';
              }
            }}
          />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={multipleFileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleImageUpload(index, Array.from(e.target.files), true);
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => multipleFileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Multiple'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;