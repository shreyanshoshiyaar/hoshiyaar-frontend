import { useEffect, useState } from 'react';
import curriculumService from '../services/curriculumService.js';

// Items of lessons already opened in this session. Every question type is its own screen, so moving to the
// next question mounts a new page; starting from the items we already have keeps the "Loading adventure"
// screen from flashing between questions (they are still refreshed in the background).
const lastItems = new Map();
const MAX_REMEMBERED = 30;
const remember = (id, data) => {
  lastItems.delete(id);
  lastItems.set(id, data);
  if (lastItems.size > MAX_REMEMBERED) lastItems.delete(lastItems.keys().next().value);
};

// `enabled: false` holds the fetch back, e.g. until the trial has let the lesson start
export function useModuleItems(moduleNumber, { enabled = true } = {}) {
  const key = String(moduleNumber || '');
  const [items, setItems] = useState(() => lastItems.get(key) || []);
  const [loading, setLoading] = useState(() => !lastItems.has(key));
  const [error, setError] = useState('');

  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let isMounted = true;
    const known = lastItems.get(key);
    if (known) {
      setItems(known);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(''); // Clear previous error
    curriculumService
      .listItems(moduleNumber)
      .then((res) => {
        const data = res?.data || [];
        // Same content as what is already on screen: keep the same list so the page doesn't restart
        if (known && JSON.stringify(known) === JSON.stringify(data)) return;
        if (Array.isArray(data) && data.length) remember(key, data);
        if (isMounted) setItems(data);
      })
      .catch((e) => { if (isMounted && !known) setError(e.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [moduleNumber, key, refreshCount, enabled]);

  const retry = () => setRefreshCount(c => c + 1);

  return { items, loading, error, retry };
}
