import { useEffect, useState } from 'react';
import curriculumService from '../services/curriculumService.js';

// Home's pictures, changeable without an app update: the "home_art" setting holds
//   { background, bgColor, backgroundDesktop, science, gita }   (image URLs and one colour; any can be left out)
//   background  ONE picture, 1080 x 2340, with a plain bgColor band in the middle (rows 1170-1638). The app shows its
//               top part pinned to the top of the screen and its bottom part pinned to the bottom, and fills the
//               space between with bgColor, so it fits short and tall phones alike.
//   bgColor     that plain colour, e.g. #E8F3FF
// Missing ones fall back to the pictures built into the app. The last copy is kept on the phone so Home
// shows the pictures straight away next time.
const KEY = 'home_art';
const CACHE = 'hy_home_art_v1';

let memo = (() => { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (_) { return null; } })();
let loading = null;

const clean = (v) => {
  const out = {};
  for (const k of ['background', 'backgroundDesktop', 'science', 'gita']) {
    const u = String(v?.[k] || '').trim();
    if (/^https:\/\//i.test(u)) out[k] = u;
  }
  const color = String(v?.bgColor || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) out.bgColor = color;
  return out;
};

export function useHomeArt() {
  const [art, setArt] = useState(memo || {});
  useEffect(() => {
    let alive = true;
    if (!loading) {
      loading = curriculumService.getSetting(KEY)
        .then((res) => {
          memo = clean(res?.data?.value ?? res?.data);
          try { localStorage.setItem(CACHE, JSON.stringify(memo)); } catch (_) {}
          return memo;
        })
        .catch(() => memo || {});
    }
    loading.then((a) => { if (alive) setArt(a || {}); });
    return () => { alive = false; };
  }, []);
  return art;
}
