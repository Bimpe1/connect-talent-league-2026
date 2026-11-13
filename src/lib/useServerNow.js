import { useEffect, useState } from 'react';

// Current time according to the SERVER (device clock + measured offset).
// Refreshes every 30s and when the tab becomes visible again (background timers get throttled).
export function useServerNow(offsetMs = 0) {
  const [deviceNow, setDeviceNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setDeviceNow(Date.now());
    const id = setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return deviceNow + offsetMs;
}
