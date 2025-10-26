import { useEffect, useState } from 'react';
import curriculumService from '../services/curriculumService.js';

export function useModuleItems(moduleNumber) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    curriculumService
      .listItems(moduleNumber)
      .then((res) => { if (isMounted) setItems(res?.data || []); })
      .catch((e) => setError(e.message))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [moduleNumber]);

  return { items, loading, error };
}


