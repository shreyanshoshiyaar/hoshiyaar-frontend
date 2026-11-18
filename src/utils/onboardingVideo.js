// The onboarding video every learner sees once per account on a device, after login, signup or starting as a guest.
// The link comes from the "onboarding_intro_video" setting (an empty value turns the video off), with DEFAULT_URL as
// the fallback. One <video> element is created early and starts downloading (on the login screen, or as soon as the
// app opens for someone who hasn't seen it); the overlay moves that same element on screen, so what was already
// downloaded is reused instead of loading again.
import curriculumService from '../services/curriculumService.js';

export const DEFAULT_URL = 'https://res.cloudinary.com/fhscvc7p/video/upload/v1794992404/HoshiYaar2.0_Onboarding_9x16_HYPE_yhpibz.mp4';
const SETTING_KEY = 'onboarding_intro_video';
const SEEN_PREFIX = 'hy_intro_video_seen_v1:';

const isCloudinaryVideo = (url) => /res\.cloudinary\.com\/.+\/video\/upload\//.test(url || '');

/** Phone-sized copy: 720 px wide, automatic quality (the 1080p original is 25 MB, this is about 6 MB) */
export const playableUrl = (url) => (isCloudinaryVideo(url)
  ? url.replace('/video/upload/', '/video/upload/q_auto,w_720/')
  : url);

/** A still from 1 s in, shown instantly while the video starts (the first frame is black) */
export const posterUrl = (url) => (isCloudinaryVideo(url)
  ? url.replace('/video/upload/', '/video/upload/so_1,w_720,q_auto/').replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg')
  : '');

let urlPromise = null;
/** The video link to use, or '' when the admin turned the video off */
export const getIntroVideoUrl = () => {
  if (!urlPromise) {
    urlPromise = curriculumService.getSetting(SETTING_KEY)
      .then((res) => {
        const value = res?.data?.value;
        if (value === '' || value === false) return '';
        return typeof value === 'string' && /^https:\/\//.test(value) ? value : DEFAULT_URL;
      })
      .catch(() => DEFAULT_URL);
  }
  return urlPromise;
};

export const hasSeenIntro = (userId) => {
  try { return Boolean(userId && localStorage.getItem(SEEN_PREFIX + userId)); } catch { return false; }
};
export const markIntroSeen = (userId) => {
  try { if (userId) localStorage.setItem(SEEN_PREFIX + userId, String(Date.now())); } catch { /* storage blocked */ }
};

let videoEl = null;
let preloadStarted = false;

/** The shared <video> element (created on first use) */
export const getIntroVideoElement = () => {
  if (!videoEl && typeof document !== 'undefined') {
    videoEl = document.createElement('video');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.playsInline = true;
    videoEl.preload = 'auto';
    // Parked off screen while it downloads; browsers skip buffering for elements that aren't in the page
    Object.assign(videoEl.style, { position: 'fixed', left: '-9999px', top: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
    document.body.appendChild(videoEl);
  }
  return videoEl;
};

/** Start downloading the video now (safe to call many times) */
export const preloadIntroVideo = async () => {
  if (preloadStarted) return;
  preloadStarted = true;
  const url = await getIntroVideoUrl();
  if (!url) return;
  const el = getIntroVideoElement();
  if (!el) return;
  const src = playableUrl(url);
  if (el.src !== src) {
    el.src = src;
    const poster = posterUrl(url);
    if (poster) {
      el.poster = poster;
      const img = new Image();
      img.src = poster; // warm the cover image too
    }
    el.load();
  }
};

/** Put the element back off screen and stop it. With release, also drop the video so it stops downloading. */
export const parkIntroVideo = ({ release = false } = {}) => {
  if (!videoEl) return;
  try { videoEl.pause(); } catch { /* not playing */ }
  if (release) {
    videoEl.removeAttribute('src');
    videoEl.removeAttribute('poster');
    try { videoEl.load(); } catch { /* nothing loaded */ }
    preloadStarted = false;
  }
  Object.assign(videoEl.style, { position: 'fixed', left: '-9999px', top: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
  document.body.appendChild(videoEl);
};

// The notification-permission prompt waits for this so the two never cover each other
export const INTRO_CLOSED_EVENT = 'hy:intro-video-closed';
export const isIntroOpen = () => Boolean(typeof window !== 'undefined' && window.__hyIntroVideoOpen);
