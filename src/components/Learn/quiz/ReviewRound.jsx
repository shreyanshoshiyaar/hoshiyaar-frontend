import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReview } from '../../../context/ReviewContext.jsx';

export default function ReviewRound() {
	const navigate = useNavigate();
	const { active, hasItems } = useReview();

  const url = useMemo(() => {
		if (!active) return null;
    const { moduleNumber, index, type } = active;
    const mod = String(moduleNumber);
    const idx = String(index);
		switch (type) {
			case 'multiple-choice': return `/learn/module/${mod}/mcq/${idx}?review=true`;
			case 'fill-in-the-blank': return `/learn/module/${mod}/fillups/${idx}?review=true`;
			case 'rearrange': return `/learn/module/${mod}/rearrange/${idx}?review=true`;
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
