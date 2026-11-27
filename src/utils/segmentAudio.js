// Plays one line out of a whole lesson's recording: the lesson's MP3 (on R2) from the line's start time to its end
// time, then stops. Used for content with recorded audio (Gita): one MP3 per lesson plus a timeline per line,
// instead of a generated voice per line.

/** The recorded part of a lesson item, or null when it has none (then the generated voice is used) */
export const segmentOf = (item) => {
  const url = item?.audioUrl;
  const start = Number(item?.audioStart);
  const end = Number(item?.audioEnd);
  if (!url || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { url, start, end };
};

/**
 * Plays `seg` on the shared narration player `audio`. Calls onTimeUpdate(secondsIntoLine) while playing and onEnd
 * when the line's end time is reached (the player is paused there, so the next line starts cleanly).
 * Returns a function that stops listening (call it before playing something else).
 */
export const playSegment = (audio, seg, { rate = 1, onEnd, onTimeUpdate, onError, onBlocked } = {}) => {
  // One line at a time per player: an earlier line still listening is cancelled (it never calls its onEnd)
  if (typeof audio._hySegStop === 'function') audio._hySegStop();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { audio.pause(); } catch (_) {}
    cleanup();
    onEnd?.();
  };
  const tick = () => {
    if (done) return;
    onTimeUpdate?.(Math.max(0, audio.currentTime - seg.start));
    // timeupdate fires about 4 times a second; stop a hair early so the next line's first sound never leaks in
    if (audio.currentTime >= seg.end - 0.06) finish();
  };
  const start = () => {
    if (done) return;
    try { audio.currentTime = seg.start; } catch (_) {}
    audio.playbackRate = rate;
    const p = audio.play();
    if (p && p.catch) p.catch((err) => { if (!done) onBlocked?.(err); });
  };
  const fail = (e) => { if (!done) { done = true; cleanup(); onError?.(e); } };
  const cleanup = () => {
    if (audio._hySegStop === cancel) audio._hySegStop = null;
    audio.removeEventListener('timeupdate', tick);
    audio.removeEventListener('ended', finish);
    audio.removeEventListener('error', fail);
    audio.removeEventListener('loadedmetadata', start);
  };
  function cancel() { if (!done) { done = true; cleanup(); } }
  audio._hySegStop = cancel;
  audio.addEventListener('timeupdate', tick);
  audio.addEventListener('ended', finish);
  audio.addEventListener('error', fail);

  // Same lesson file already loaded: jump straight to the line. Otherwise load it (the server streams the part
  // asked for, so a far-away line does not wait for the whole file)
  const sameFile = audio.src && audio.src.split('#')[0] === new URL(seg.url, window.location.href).href;
  if (sameFile && audio.readyState >= 1) start();
  else {
    audio.addEventListener('loadedmetadata', start, { once: true });
    audio.preload = 'auto';
    audio.src = seg.url;
    try { audio.load(); } catch (_) {}
  }
  return cancel;
};
