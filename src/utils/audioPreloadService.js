/**
 * Audio Preload & Playback Activation Service
 * Preloads upcoming audio tracks in memory so playback starts with 0 latency.
 * Handles mobile WebView audio unlocking and mic/speaker permissions.
 */

const preloadedAudios = new Map();
const MAX_PRELOADS = 12;
let isUnlocked = false;

// Global active audio registry to track and prevent concurrent/overlapping audio
const globalActiveAudios = new Set();

// Automatically track every HTMLMediaElement that plays in the app
if (typeof window !== 'undefined' && typeof HTMLMediaElement !== 'undefined' && !window.__hoshiyaarAudioHooked) {
  window.__hoshiyaarAudioHooked = true;
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(...args) {
    globalActiveAudios.add(this);
    const cleanup = () => globalActiveAudios.delete(this);
    this.addEventListener('ended', cleanup, { once: true });
    this.addEventListener('pause', cleanup, { once: true });
    this.addEventListener('error', cleanup, { once: true });
    return originalPlay.apply(this, args);
  };
}

/**
 * Universally stops all playing audios across the entire application.
 * Guaranteed to silence previous dialogue/chapter/questions when transitioning
 * or playing completion/victory sounds.
 * @param {HTMLMediaElement|null} exceptElement - Optional audio element to keep playing
 */
export const stopAllAudio = (exceptElement = null) => {
  if (typeof window === 'undefined') return;

  // 1. Pause and reset all registered active audio elements
  globalActiveAudios.forEach((audio) => {
    if (audio && audio !== exceptElement) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
        audio.onerror = null;
        audio.ontimeupdate = null;
      } catch (_) {}
    }
  });

  if (!exceptElement) {
    globalActiveAudios.clear();
  } else {
    globalActiveAudios.forEach((audio) => {
      if (audio !== exceptElement) globalActiveAudios.delete(audio);
    });
  }

  // 2. Stop active TTS audio if any
  if (activePlayingAudio && activePlayingAudio !== exceptElement) {
    try {
      activePlayingAudio.pause();
      activePlayingAudio.currentTime = 0;
      activePlayingAudio.onended = null;
      activePlayingAudio.onerror = null;
    } catch (_) {}
    activePlayingAudio = null;
  }

  // 3. Clear preloaded audios
  clearPreloads();

  // 4. Cancel browser Web Speech synthesis
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }

  // 5. Broadcast global stop event to any listening components
  try {
    window.dispatchEvent(new CustomEvent('hoshiyaar:stop_audio', { detail: { except: exceptElement } }));
  } catch (_) {}
};

// One shared player for lesson narration (story and board lines). Safari only lets a player
// make sound if that same player was started during a tap, and a new player per line was
// blocked at every new lesson until the learner touched the screen. This one is unlocked on
// every tap (see below) and reused for each line.
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
const narrationAudio = typeof Audio !== 'undefined' ? new Audio() : null;
let narrationTurn = 0;

/**
 * The shared narration player, cleared of the previous line's handlers. `audio._hyTurn` changes
 * on every claim: a line whose download finished late compares it to know it's been replaced.
 */
export const claimNarrationAudio = () => {
  if (!narrationAudio) return new Audio();
  try { narrationAudio.pause(); } catch (_) {}
  narrationAudio.onplay = null;
  narrationAudio.onended = null;
  narrationAudio.onerror = null;
  narrationAudio.ontimeupdate = null;
  narrationAudio.preload = 'auto';
  narrationTurn += 1;
  narrationAudio._hyTurn = narrationTurn;
  return narrationAudio;
};

// Quietly start the shared player inside a tap, unless it's narrating right now
const primeNarration = () => {
  if (!narrationAudio) return;
  const busy = !narrationAudio.paused || (narrationAudio.src && narrationAudio.src !== SILENT_WAV && !narrationAudio.ended && narrationAudio.currentTime > 0);
  if (busy) return;
  try {
    narrationAudio.muted = true;
    narrationAudio.src = SILENT_WAV;
    const p = narrationAudio.play();
    const done = () => { try { narrationAudio.pause(); } catch (_) {} narrationAudio.muted = false; };
    if (p && typeof p.then === 'function') p.then(done, done); else done();
  } catch (_) { narrationAudio.muted = false; }
};
if (typeof window !== 'undefined') {
  // Every tap counts, including the one that opens the next lesson
  window.addEventListener('pointerdown', primeNarration, { capture: true, passive: true });
  window.addEventListener('touchend', primeNarration, { capture: true, passive: true });
}

export const unlockMobileAudio = () => {
  primeNarration();
  if (isUnlocked || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.volume = 0.01;
    const p = silentAudio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        isUnlocked = true;
      }).catch(() => {});
    } else {
      isUnlocked = true;
    }
  } catch (_) {}
};

export const requestAudioPermissions = async () => {
  unlockMobileAudio();
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
  } catch (err) {
    console.log('[AudioPermission] Microphone request status:', err?.message);
  }
  return false;
};

// Global unlock on first user gesture
if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', unlockMobileAudio, { once: true, passive: true });
  window.addEventListener('click', unlockMobileAudio, { once: true, passive: true });
}

export const preloadAudio = (url) => {
  if (!url || typeof url !== 'string') return;
  if (preloadedAudios.has(url)) return;

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();

    if (preloadedAudios.size >= MAX_PRELOADS) {
      const oldestKey = preloadedAudios.keys().next().value;
      const oldAudio = preloadedAudios.get(oldestKey);
      if (oldAudio) {
        oldAudio.src = '';
      }
      preloadedAudios.delete(oldestKey);
    }

    preloadedAudios.set(url, audio);
  } catch (_) {}
};

export const getPreloadedAudio = (url) => {
  if (!url) return null;
  return preloadedAudios.get(url) || null;
};

export const clearPreloads = () => {
  preloadedAudios.forEach((audio) => {
    try {
      audio.pause();
      audio.src = '';
    } catch (_) {}
  });
  preloadedAudios.clear();
};

// TTS prefetch: downloads whole dialogue clips into memory (blob URLs) so the next line
// starts instantly. `preload='auto'` alone is ignored by many mobile WebViews.
// Kept apart from preloadedAudios so stopAllAudio() between lines doesn't discard them.
const ttsBlobUrls = new Map(); // tts url -> blob: url
const ttsInflight = new Map(); // tts url -> Promise<blob url | null>
const ttsQueue = [];
const MAX_TTS_BLOBS = 60;
const MAX_TTS_FETCHES = 2; // each uncached line is a fresh synthesis on the backend
let activeTtsFetches = 0;

const pumpTtsQueue = () => {
  while (activeTtsFetches < MAX_TTS_FETCHES && ttsQueue.length) {
    const job = ttsQueue.shift();
    activeTtsFetches++;
    fetch(job.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Cloud fallback audio is deliberately uncached so the real voice is retried later
        const keep = res.headers.get('X-TTS-Engine') !== 'cloud';
        return res.blob().then(blob => ({ blob, keep }));
      })
      .then(({ blob, keep }) => {
        if (!blob.size || !keep) return job.resolve(null);
        if (ttsBlobUrls.size >= MAX_TTS_BLOBS) {
          const oldestKey = ttsBlobUrls.keys().next().value;
          URL.revokeObjectURL(ttsBlobUrls.get(oldestKey));
          ttsBlobUrls.delete(oldestKey);
        }
        const blobUrl = URL.createObjectURL(blob);
        ttsBlobUrls.set(job.url, blobUrl);
        job.resolve(blobUrl);
      })
      .catch(() => job.resolve(null))
      .finally(() => {
        ttsInflight.delete(job.url);
        activeTtsFetches--;
        pumpTtsQueue();
      });
  }
};

/**
 * Queue a TTS clip for download. `priority` moves it to the front (use for the very next line).
 * Resolves with a blob URL, or null if it could not be fetched (callers fall back to the plain URL).
 */
export const prefetchTts = (url, { priority = false } = {}) => {
  if (!url || typeof url !== 'string' || typeof fetch === 'undefined') return Promise.resolve(null);
  if (ttsBlobUrls.has(url)) return Promise.resolve(ttsBlobUrls.get(url));
  if (ttsInflight.has(url)) {
    if (priority) {
      const i = ttsQueue.findIndex(job => job.url === url);
      if (i > 0) ttsQueue.unshift(ttsQueue.splice(i, 1)[0]);
    }
    return ttsInflight.get(url);
  }
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  const job = { url, resolve };
  if (priority) ttsQueue.unshift(job); else ttsQueue.push(job);
  ttsInflight.set(url, promise);
  pumpTtsQueue();
  return promise;
};

/** The in-memory copy of a TTS clip if it has been prefetched, otherwise the URL itself. */
export const getTtsSrc = (url) => ttsBlobUrls.get(url) || url;

/**
 * Wait (up to `timeoutMs`) for a clip that is already downloading, so the player reuses that
 * download instead of starting a second synthesis of the same line. Resolves with the src to play.
 * A new line takes the server 2.5-6 s to generate, so the wait is long: giving up early made the
 * player request the same line again and the server generate it twice.
 */
export const waitForTts = (url, timeoutMs = 12000) => {
  if (ttsBlobUrls.has(url)) return Promise.resolve(ttsBlobUrls.get(url));
  const timeout = new Promise(r => setTimeout(r, timeoutMs));
  return Promise.race([prefetchTts(url, { priority: true }), timeout]).then(() => getTtsSrc(url));
};

import { getApiBase } from './apiBase.js';

let activePlayingAudio = null;

export const playTtsAudio = (text, speaker = 'Arpit Sir', onEnd) => {
  if (!text) return null;
  unlockMobileAudio();

  // Stop any currently playing audio track
  if (activePlayingAudio) {
    try {
      activePlayingAudio.pause();
      activePlayingAudio.currentTime = 0;
      activePlayingAudio.onended = null;
      activePlayingAudio.onerror = null;
    } catch (_) {}
    activePlayingAudio = null;
  }

  // Cancel any ongoing local speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }

  const cleanText = String(text).replace(/["*_]/g, '').trim();
  const apiBase = getApiBase();
  const ttsUrl = `${apiBase}/api/ai/tts?text=${encodeURIComponent(cleanText)}&speaker=${encodeURIComponent(speaker)}&v=15`;

  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = getTtsSrc(ttsUrl);
  activePlayingAudio = audio;

  const handleDone = () => {
    if (activePlayingAudio === audio) activePlayingAudio = null;
    if (typeof onEnd === 'function') onEnd();
  };

  audio.onended = handleDone;
  audio.onerror = () => {
    console.warn('[TTS] Server audio failed, trying speech synthesis fallback');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.rate = 1.0;
        utter.onend = handleDone;
        utter.onerror = handleDone;
        window.speechSynthesis.speak(utter);
        return;
      } catch (_) {}
    }
    handleDone();
  };

  const p = audio.play();
  if (p && typeof p.then === 'function') {
    p.catch(err => {
      console.warn('[TTS] Autoplay blocked, unlocking:', err);
      unlockMobileAudio();
      audio.onerror();
    });
  }
  return audio;
};

export default {
  preloadAudio,
  getPreloadedAudio,
  clearPreloads,
  unlockMobileAudio,
  requestAudioPermissions,
  playTtsAudio,
  stopAllAudio
};
