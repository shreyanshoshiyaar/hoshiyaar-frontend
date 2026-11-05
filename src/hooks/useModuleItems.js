import { useEffect, useState } from 'react';
import curriculumService from '../services/curriculumService.js';

// `enabled: false` holds the fetch back, e.g. until the trial has let the lesson start
export function useModuleItems(moduleNumber, { enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let isMounted = true;
    setLoading(true);
    setError(''); // Clear previous error
    curriculumService
      .listItems(moduleNumber)
      .then((res) => { if (isMounted) setItems(res?.data || []); })
      .catch((e) => { if (isMounted) setError(e.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [moduleNumber, refreshCount, enabled]);

  const retry = () => setRefreshCount(c => c + 1);

  return { items, loading, error, retry };
}


