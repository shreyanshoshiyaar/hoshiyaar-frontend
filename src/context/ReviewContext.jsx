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

	const hasItems = queue.length > 0;
	const active = useMemo(() => (hasItems ? queue[Math.min(cursor, queue.length - 1)] : null), [queue, cursor, hasItems]);

	const add = (item) => {
		setQueue(prev => {
			if (prev.some(q => q.questionId === item.questionId)) return prev;
			return [...prev, item];
		});
	};

	const reset = () => {
		setQueue([]);
		setCursor(0);
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
		setQueue(prev => prev.filter(q => q.questionId !== active.questionId));
		setCursor(0);
	};

	// Move current active item to the end of the queue (for incorrect in review mode)
	const requeueActive = () => {
		setQueue(prev => {
			if (!prev || prev.length === 0) return prev;
			const [first, ...rest] = prev;
			return [...rest, first];
		});
		setCursor(0);
	};

	const value = { queue, active, hasItems, add, reset, start, next, removeActive, requeueActive };
	return (
		<ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
	);
};
