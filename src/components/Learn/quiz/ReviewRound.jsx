import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReview } from '../../../context/ReviewContext.jsx';

export default function ReviewRound() {
	const navigate = useNavigate();
	const { active, hasItems } = useReview();

  const url = useMemo(() => {
		if (!active) return null;
    const { moduleNumber, index, type, _source } = active;
    const mod = String(moduleNumber);
    const idx = String(index);
    // Use revision=true for default revision queue, review=true for incorrect review queue
    const modeParam = _source === 'default' ? 'revision=true' : 'review=true';
    
		switch (type) {
			case 'multiple-choice': return `/learn/module/${mod}/mcq/${idx}?${modeParam}`;
			case 'fill-in-the-blank': return `/learn/module/${mod}/fillups/${idx}?${modeParam}`;
			case 'rearrange': return `/learn/module/${mod}/rearrange/${idx}?${modeParam}`;
			case 'statement':
			case 'concept':
				return `/learn/module/${mod}/concept/${idx}?${modeParam}`;
			default: return null;
		}
	}, [active]);

	useEffect(() => {
		// Only end round when queue is empty
		if (!hasItems) navigate('/lesson-complete', { replace: true });
	}, [hasItems, navigate]);

	// We no longer listen for global completion events; pages navigate back themselves

	useEffect(() => {
		if (url) navigate(url, { replace: true });
	}, [url, navigate]);

	return null;
}
