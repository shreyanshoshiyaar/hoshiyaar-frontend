import React, { createContext, useContext, useMemo, useState } from 'react';

const ReviewContext = createContext(null);

export const useReview = () => {
	const ctx = useContext(ReviewContext);
	if (!ctx) throw new Error('useReview must be used within a ReviewProvider');
	return ctx;
};

export const ReviewProvider = ({ children }) => {
	const [queue, setQueue] = useState([]); // [{questionId, moduleNumber, index, type}]
	const [cursor, setCursor] = useState(0);
	const [history, setHistory] = useState([]); // To support going back to previous questions
	// Track the module scope for the current queue; reset when module changes
	const [currentModule, setCurrentModule] = useState(null);
	// Buffer incorrect questionIds per module for deferred persistence
	const [pendingIncorrectByModule, setPendingIncorrectByModule] = useState({}); // { [moduleId]: string[] }

	const hasItems = queue.length > 0;
	const active = useMemo(() => (hasItems ? queue[Math.min(cursor, queue.length - 1)] : null), [queue, cursor, hasItems]);

	const add = (item) => {
		const incomingModule = item?.moduleNumber != null ? String(item.moduleNumber) : null;
		const isRevisionMode = item._source === 'default' || item._source === 'incorrect';
		const shouldResetForModuleChange = !isRevisionMode && incomingModule && currentModule && incomingModule !== currentModule;

		if (shouldResetForModuleChange) {
			setCursor(0);
		}
		if (incomingModule && incomingModule !== currentModule) {
			setCurrentModule(incomingModule);
		}

		setQueue(prev => {
			const baseQueue = shouldResetForModuleChange ? [] : prev;
			const alreadyThere = baseQueue.some(q => q.questionId === item.questionId);
			if (alreadyThere) return baseQueue;
			
			const newQueue = [...baseQueue, item];
			// If adding items with _order, maintain sorted order (check if any item has _order)
			if (item._order != null && newQueue.some(q => q._order != null)) {
				return newQueue.sort((a, b) => Number(a._order || 0) - Number(b._order || 0));
			}
			return newQueue;
		});
	};

	const reset = () => {
		setQueue([]);
		setCursor(0);
		setHistory([]);
		setCurrentModule(null);
	};

	const start = () => {
		setCursor(0);
		return queue;
	};

	const next = () => {
		setCursor(prev => Math.min(prev + 1, Math.max(0, queue.length - 1)));
	};

	const removeActive = () => {
		if (!active) return;
		setHistory(prev => [...prev, active]);
		setQueue(prev => {
			const filtered = prev.filter(q => q.questionId !== active.questionId);
			// Re-sort by _order to maintain revision sequence (if _order exists)
			if (filtered.length > 0 && filtered[0]._order != null) {
				return filtered.sort((a, b) => Number(a._order || 0) - Number(b._order || 0));
			}
			return filtered;
		});
		setCursor(0);
	};

	// Move current active item to the end of the queue (for incorrect in review mode)
	// Preserves all metadata including _order, _revisionData, etc.
	const requeueActive = () => {
		setHistory(prev => [...prev, active]); // Also add to history so they can undo a wrong answer
		setQueue(prev => {
			if (!prev || prev.length === 0 || !active) return prev;
			// Remove the active item from its current position
			const filtered = prev.filter(q => q.questionId !== active.questionId);
			// Add it to the end with all its metadata preserved
			const requeuedItem = { ...active };
			const newQueue = [...filtered, requeuedItem];
			// Don't re-sort by _order when requeuing (keep it at the end)
			return newQueue;
		});
		setCursor(0);
	};

	const undoActive = () => {
		if (history.length === 0) return false;
		const lastItem = history[history.length - 1];
		setHistory(prev => prev.slice(0, -1));
		setQueue(prev => {
			// Remove it from wherever it is (in case it was requeued to the end)
			const filtered = prev.filter(q => q.questionId !== lastItem.questionId);
			// Add it back to the very front
			return [lastItem, ...filtered];
		});
		setCursor(0);
		return true;
	};

	// Stage incorrect question for a given module (deferred save)
	const stageIncorrect = (moduleId, questionId) => {
		setPendingIncorrectByModule(prev => {
			const mod = String(moduleId || '');
			const next = { ...prev };
			const set = new Set(next[mod] || []);
			set.add(String(questionId));
			next[mod] = Array.from(set);
			return next;
		});
	};

	// Clear staged incorrects for a module (used when user abandons mid-lesson)
	const clearStagedForModule = (moduleId) => {
		setPendingIncorrectByModule(prev => {
			const mod = String(moduleId || '');
			if (!prev[mod]) return prev;
			const next = { ...prev };
			delete next[mod];
			return next;
		});
	};

	// Get staged incorrects for a module
	const getStagedForModule = (moduleId) => {
		const mod = String(moduleId || '');
		const arr = pendingIncorrectByModule[mod] || [];
		return Array.isArray(arr) ? arr : [];
	};

	return (
		<ReviewContext.Provider
			value={{
				queue,
				cursor,
				active,
				hasItems,
				add,
				reset,
				start,
				next,
				removeActive,
				requeueActive,
				undoActive,
				hasHistory: history.length > 0,
				currentModule,
				stageIncorrect,
				clearStagedForModule,
				getStagedForModule,
				pendingIncorrectByModule,
			}}
		>
			{children}
		</ReviewContext.Provider>
	);
};
