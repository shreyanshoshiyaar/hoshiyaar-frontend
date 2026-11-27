// Microsoft Clarity custom events and tags, for Nidhi's funnel (Clarity → Smart events → API events).
// In the Android app they go through the HoshiClarity bridge in MainActivity (Clarity SDK); on the website,
// through the Clarity web tag. Never send a phone number, email or name: these are kids' accounts.

const bridge = () => (typeof window !== 'undefined' ? window.HoshiClarity : null);
const web = () => (typeof window !== 'undefined' && typeof window.clarity === 'function' ? window.clarity : null);

const safe = (fn) => { try { fn(); } catch (_) { /* analytics must never break the app */ } };

/** One custom event, by its exact funnel name */
export const clarityEvent = (name) => safe(() => {
  const b = bridge();
  if (b?.event) b.event(String(name));
  else web()?.('event', String(name));
});

/** A custom event at most once per app session (e.g. content_loaded) */
export const clarityEventOnce = (name) => {
  try {
    const key = `hy_clarity_once_${name}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (_) { /* storage blocked: send anyway */ }
  clarityEvent(name);
};

/** A user tag, e.g. grade = 7 */
export const clarityTag = (key, value) => safe(() => {
  if (value == null || value === '') return;
  const b = bridge();
  if (b?.tag) b.tag(String(key), String(value));
  else web()?.('set', String(key), String(value));
});

/** The app's internal user id only */
export const clarityUserId = (id) => safe(() => {
  if (!id) return;
  const b = bridge();
  if (b?.userId) b.userId(String(id));
  else web()?.('identify', String(id));
});
