import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import axios from 'axios';
import { getApiBase } from '../../utils/apiBase.js';

const API = getApiBase();
const http = axios.create({
  baseURL: API,
  timeout: 42000,
  withCredentials: false,
});

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
          return { ...item, modelAnswers: mAnswers };
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
      type: newType,
      order: oldItem.order || index + 1,
    };

    let newItem;
    if (newType === 'statement') {
      newItem = {
        ...baseItem,
        text: oldItem.text || oldItem.question || '',
      };
    } else if (newType === 'comic') {
      newItem = {
        ...baseItem,
        images: oldItem.images || (oldItem.imageUrl ? [oldItem.imageUrl] : []),
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
      type: 'statement',
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
        const imageUrl = response.data.url || response.data.secure_url;
        updated[itemIndex] = {
          ...updated[itemIndex],
          imageUrl: imageUrl,
        };
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
      updated[itemIndex] = { ...updated[itemIndex], imageUrl: url };
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
      updated[itemIndex] = { ...updated[itemIndex], imageUrl: '' };
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

      const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

      const concepts = sortedItems.map((item) => {
        const concept = {
          type: item.type,
        };

        // Include _id if it exists and is not a temporary new item ID
        // Handle both string and ObjectId formats
        const itemId = item._id ? String(item._id) : null;
        if (itemId && !itemId.startsWith('new-')) {
          concept._id = itemId;
          console.log('[ContentEditor] Including _id in payload:', itemId, 'for item type:', item.type);
        } else {
          console.log('[ContentEditor] No _id or temporary ID for item:', item.type, itemId);
        }

        if (item.type === 'statement') {
          concept.text = item.text || '';
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

      if (importedCount === concepts.length && skippedCount === 0) {
        setSuccess(`Successfully saved! ${importedCount} items imported.`);
      } else {
        setSuccess(`Saved with warnings: ${importedCount} items imported, ${skippedCount} skipped. Check backend logs for details.`);
      }

      setHasUnsavedChanges(false);

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
          {success}
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
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Type:</label>
                    <select
                      value={item.type || 'statement'}
                      onChange={(e) => changeItemType(actualIndex, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="statement">Statement</option>
                      <option value="comic">Comic Slides</option>
                      <option value="multiple-choice">MCQ</option>
                      <option value="fill-in-the-blank">Fill in the Blank</option>
                      <option value="rearrange">Rearrange</option>
                      <option value="descriptive">Descriptive Question</option>
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
                  </div>
                  <button
                    onClick={() => removeItem(actualIndex)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Statement Type */}
                {item.type === 'statement' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Content
                      </label>
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => updateItem(actualIndex, 'text', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter statement text..."
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
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                      Upload your comic slides below using the Multiple Images tool. They will be displayed perfectly in the comic viewer.
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
        Images
      </label>

      {/* Single Image (imageUrl) */}
      <div className="mb-4">
        <div className="text-xs text-gray-600 mb-2">Single Image (Primary)</div>
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
        <div className="flex gap-2">
          <input
            type="text"
            value={item.imageUrl || ''}
            onChange={(e) => handleImageUrlInput(index, e.target.value, false)}
            placeholder="Paste image URL here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="file"
            accept="image/*"
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
            accept="image/*"
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