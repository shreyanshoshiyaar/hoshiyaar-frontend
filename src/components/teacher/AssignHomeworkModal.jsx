import React, { useState, useEffect, useMemo } from 'react';
import curriculumService from '../../services/curriculumService.js';
import teacherService from '../../services/teacherService.js';

export default function AssignHomeworkModal({ classroom, isOpen, onClose, onAssignmentCreated }) {
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [modules, setModules] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState(new Set());
  const [isEntireChapter, setIsEntireChapter] = useState(true);

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Group modules into units using actual Unit names from database
  const groupedUnits = useMemo(() => {
    const unitMap = new Map();

    // Pre-populate unit map with registered units for this chapter
    units.forEach((u) => {
      const uId = String(u._id);
      unitMap.set(uId, {
        unitId: uId,
        title: u.title || (typeof u.order === 'number' ? `Unit ${u.order}` : 'Unit'),
        order: typeof u.order === 'number' ? u.order : 1,
        modules: [],
      });
    });

    modules.forEach((m) => {
      const rawUnitId = m.unitId?._id 
        ? String(m.unitId._id) 
        : (m.unitId ? String(m.unitId) : 'unassigned_unit');

      let groupObj = unitMap.get(rawUnitId);
      if (!groupObj) {
        const titleFromPopulated = typeof m.unitId === 'object' && m.unitId?.title;
        const orderFromPopulated = typeof m.unitId === 'object' && typeof m.unitId?.order === 'number'
          ? m.unitId.order
          : 999;

        groupObj = {
          unitId: rawUnitId,
          title: titleFromPopulated || 'Unit',
          order: orderFromPopulated,
          modules: [],
        };
        unitMap.set(rawUnitId, groupObj);
      }
      groupObj.modules.push(m);
    });

    return Array.from(unitMap.values())
      .filter((g) => g.modules.length > 0)
      .sort((a, b) => a.order - b.order);
  }, [modules, units]);

  const handleToggleUnit = (unitModules) => {
    const uIds = unitModules.map(m => m._id);
    const allSelected = uIds.every(id => selectedModuleIds.has(id));
    const next = new Set(selectedModuleIds);
    if (allSelected) {
      uIds.forEach(id => next.delete(id));
    } else {
      uIds.forEach(id => next.add(id));
    }
    setSelectedModuleIds(next);
    setIsEntireChapter(next.size === modules.length && modules.length > 0);
  };

  // Default to tomorrow 6:00 PM
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      setDueDate(formatDateTimeLocal(tomorrow));
      loadChapters();
    }
  }, [isOpen, classroom]);

  function formatDateTimeLocal(d) {
    const pad = (n) => String(n).padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  }

  const loadChapters = async () => {
    try {
      setLoadingChapters(true);
      setError('');
      const rawClass = classroom?.classLevel ? String(classroom.classLevel).trim() : '8';
      const res = await curriculumService.listChapters(
        'CBSE',
        classroom?.subject || 'Science',
        { classTitle: rawClass },
        { bypassCache: true }
      );
      const chs = Array.isArray(res?.data) ? res.data : [];
      setChapters(chs);
      if (chs.length > 0) {
        handleSelectChapter(chs[0]);
      }
    } catch (err) {
      console.error('Failed to load chapters', err);
      setError('Unable to load chapters. Please try again.');
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleSelectChapter = async (ch) => {
    setSelectedChapter(ch);
    setTitle(`${ch.title} - Homework`);
    try {
      setLoadingModules(true);
      const [modulesRes, unitsRes] = await Promise.allSettled([
        curriculumService.listModules(ch._id, { bypassCache: true }),
        curriculumService.listUnits(ch._id, { bypassCache: true })
      ]);

      const mods = modulesRes.status === 'fulfilled' && Array.isArray(modulesRes.value?.data)
        ? modulesRes.value.data
        : [];
      const unitList = unitsRes.status === 'fulfilled' && Array.isArray(unitsRes.value?.data)
        ? unitsRes.value.data
        : [];

      // Sort by order
      mods.sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(mods);
      setUnits(unitList);

      // By default select entire chapter
      const allIds = new Set(mods.map(m => m._id));
      setSelectedModuleIds(allIds);
      setIsEntireChapter(true);
    } catch (err) {
      console.error('Failed to load lessons', err);
      setModules([]);
      setUnits([]);
      setSelectedModuleIds(new Set());
    } finally {
      setLoadingModules(false);
    }
  };

  const handleToggleEntireChapter = () => {
    if (isEntireChapter) {
      setIsEntireChapter(false);
      setSelectedModuleIds(new Set());
    } else {
      setIsEntireChapter(true);
      setSelectedModuleIds(new Set(modules.map(m => m._id)));
    }
  };

  const handleToggleModule = (mid) => {
    const next = new Set(selectedModuleIds);
    if (next.has(mid)) {
      next.delete(mid);
    } else {
      next.add(mid);
    }
    setSelectedModuleIds(next);
    setIsEntireChapter(next.size === modules.length && modules.length > 0);
  };

  // Quick Presets for Deadline
  const applyPreset = (presetType) => {
    const d = new Date();
    if (presetType === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    } else if (presetType === '2days') {
      d.setDate(d.getDate() + 2);
      d.setHours(20, 0, 0, 0);
    } else if (presetType === 'sunday') {
      const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSunday);
      d.setHours(20, 0, 0, 0);
    }
    setDueDate(formatDateTimeLocal(d));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a homework title.');
      return;
    }
    if (!selectedChapter) {
      setError('Please select a chapter.');
      return;
    }
    if (selectedModuleIds.size === 0) {
      setError('Please select at least one lesson to assign.');
      return;
    }
    if (!dueDate) {
      setError('Please select a deadline.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const targetLessons = modules
        .filter(m => selectedModuleIds.has(m._id))
        .map(m => ({
          moduleId: m._id,
          title: m.title,
          order: m.order || 1,
        }));

      const payload = {
        title: title.trim(),
        instructions: instructions.trim(),
        chapterId: selectedChapter._id,
        chapterTitle: selectedChapter.title,
        targetLessons,
        isEntireChapter,
        dueDate: new Date(dueDate).toISOString(),
      };

      const res = await teacherService.createAssignment(classroom._id, payload);
      if (res?.data?.success) {
        onAssignmentCreated?.(res.data.assignment);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create assignment', err);
      setError(err.response?.data?.message || 'Failed to assign homework. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#1E293B] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-300 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-md">
              📝
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Assign Homework</h3>
              <p className="text-xs text-slate-300 font-medium">
                {classroom?.name} • Class {classroom?.classLevel} {classroom?.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-slate-800">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Homework Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 2: Essential Lessons & Quiz"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
              required
            />
          </div>

          {/* Chapter Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Select Chapter <span className="text-red-500">*</span>
            </label>
            {loadingChapters ? (
              <div className="py-3 text-xs text-slate-400 font-semibold animate-pulse">
                Loading chapters from curriculum...
              </div>
            ) : chapters.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                No chapters found for Class {classroom?.classLevel} {classroom?.subject}.
              </div>
            ) : (
              <select
                value={selectedChapter?._id || ''}
                onChange={(e) => {
                  const ch = chapters.find(c => c._id === e.target.value);
                  if (ch) handleSelectChapter(ch);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
              >
                {chapters.map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.order ? `Ch ${ch.order}: ` : ''}{ch.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lesson Checkboxes Container - Unit Wise & Subtle Blue */}
          <div className="bg-blue-50/30 border border-blue-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 mb-3">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Lessons to Complete
                </span>
                <span className="ml-2 text-xs font-bold text-[#1E65FA] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {selectedModuleIds.size} of {modules.length} selected
                </span>
              </div>

              {/* Master Checkbox: Select All Units */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isEntireChapter}
                  onChange={handleToggleEntireChapter}
                  className="w-4 h-4 rounded text-[#1E65FA] focus:ring-[#1E65FA] border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800">
                  Select All Units
                </span>
              </label>
            </div>

            {loadingModules ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1E65FA] border-t-transparent rounded-full animate-spin"></div>
                <span>Loading lessons & units...</span>
              </div>
            ) : modules.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No lessons found for this chapter.
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {groupedUnits.map((group) => {
                  const unitAllSelected = group.modules.every((m) => selectedModuleIds.has(m._id));

                  return (
                    <div key={group.unitId} className="space-y-1.5">
                      {/* Unit Header Bar */}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">📂</span>
                          <span className="text-xs font-black text-blue-900 uppercase tracking-wide">
                            {group.title}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                            {group.modules.length} {group.modules.length === 1 ? 'lesson' : 'lessons'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleUnit(group.modules)}
                          className="text-[10px] font-bold text-[#1E65FA] hover:text-[#0A3DAA] transition-colors"
                        >
                          {unitAllSelected ? 'Deselect Unit' : 'Select Unit'}
                        </button>
                      </div>

                      {/* Lessons in this unit */}
                      <div className="space-y-1.5 pl-1">
                        {group.modules.map((m, idx) => {
                          const isChecked = selectedModuleIds.has(m._id);
                          return (
                            <div
                              key={m._id}
                              onClick={() => handleToggleModule(m._id)}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                isChecked
                                  ? 'bg-blue-50/90 border-[#1E65FA]/70 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-[#1E65FA] focus:ring-[#1E65FA] border-slate-300 cursor-pointer pointer-events-none"
                              />
                              <div className="flex-1 text-xs font-bold text-slate-800">
                                <span className={isChecked ? 'text-[#1E65FA] mr-2 font-mono font-black' : 'text-slate-400 mr-2 font-mono'}>
                                  #{m.order || idx + 1}
                                </span>
                                {m.title}
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-black uppercase text-white bg-[#1E65FA] px-2 py-0.5 rounded-md shadow-2xs">
                                  Included
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deadline / Time Period */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Completion Deadline <span className="text-red-500">*</span>
              </label>
              
              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('tomorrow')}
                  className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-900 hover:text-white px-2 py-0.5 rounded-md transition-colors border border-slate-200"
                >
                  Tomorrow 6 PM
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('2days')}
                  className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-900 hover:text-white px-2 py-0.5 rounded-md transition-colors border border-slate-200"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('sunday')}
                  className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-900 hover:text-white px-2 py-0.5 rounded-md transition-colors border border-slate-200"
                >
                  Sunday 8 PM
                </button>
              </div>
            </div>

            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10"
              required
            />
          </div>

          {/* Optional Instructions */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Instructions for Students <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please solve all quizzes carefully. We will discuss tough questions in class tomorrow!"
              className="w-full px-3.5 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 resize-none text-slate-800"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedModuleIds.size === 0}
              className="px-6 py-3 bg-[#1E65FA] hover:bg-[#1656e0] disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all shadow-md flex items-center gap-2"
            >
              {submitting ? 'Assigning...' : `Assign ${selectedModuleIds.size} Lessons →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
