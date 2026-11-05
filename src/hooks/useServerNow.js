import { useEffect, useState } from 'react';
import { useAccess } from '../context/AccessContext.jsx';

// Server time that ticks every second, for live countdowns. Uses the gap between the
// server and device clocks, so changing the phone's time does not change the trial.
export function useServerNow(intervalMs = 1000) {
  const { serverOffset = 0 } = useAccess();
  const [now, setNow] = useState(() => Date.now() + serverOffset);

  useEffect(() => {
    setNow(Date.now() + serverOffset);
    const id = setInterval(() => setNow(Date.now() + serverOffset), intervalMs);
    return () => clearInterval(id);
  }, [serverOffset, intervalMs]);

  return now;
}
