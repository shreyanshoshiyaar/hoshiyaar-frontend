// One list of the lesson characters and their pictures, used by the story, board and engagement
// screens. Pictures can be replaced from Admin → Character Images, which saves the replacements in
// the "character_images" setting as { [key]: imageUrl }; the images below are the defaults.
import { useEffect, useState } from 'react';
import curriculumService from '../services/curriculumService.js';

const ARPIT_SIR_IMG = 'https://res.cloudinary.com/imq5966f/image/upload/c_thumb,g_face,w_400,h_400,z_0.75/v1792746731/img-to-link/qmkyfvxqhrnvo7tyy6ze.jpg';
const placeholder = (seed) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

export const SETTING_KEY = 'character_images';

// Checked in this order against the lower-cased speaker name (first match wins)
export const CHARACTERS = [
  { key: 'myra', name: 'Myra', match: ['myra'], image: 'https://res.cloudinary.com/imq5966f/image/upload/v1791543787/img-to-link/ayqvapvovlppgkniud7k.webp' },
  { key: 'ruhaan', name: 'Ruhaan', match: ['ruhaa', 'ruhan'], image: 'https://res.cloudinary.com/imq5966f/image/upload/v1791543788/img-to-link/cgel5nvus6jbhxlbghhu.webp' },
  { key: 'babloo', name: 'Babloo', match: ['babloo'], image: 'https://res.cloudinary.com/imq5966f/image/upload/v1791543789/img-to-link/rqwxrpdymyzbhqd74eiy.webp' },
  { key: 'chinki', name: 'Chinki Didi', match: ['chinki', 'didi'], image: 'https://res.cloudinary.com/imq5966f/image/upload/c_crop,x_25,y_135,w_310,h_310/c_scale,w_300,h_300/v1792740022/img-to-link/bhpngalg3micbma3fjqc.webp' },
  { key: 'hoshi', name: 'Hoshi', match: ['hoshi'], image: 'https://res.cloudinary.com/imq5966f/image/upload/v1791543786/img-to-link/rtyoddo8fjqspbtngsri.webp' },
  // The old Dadi picture link (img-to-link/dee69e93.png) no longer exists; upload one from Admin
  { key: 'dadi', name: 'Dadi', match: ['dadi', 'nani', 'grandma', 'grandmother'], image: placeholder('Dadi') },
  { key: 'farmer_lakshmi', name: 'Farmer Lakshmi', match: ['lakshmi', 'farmer'], image: placeholder('Lakshmi') },
  { key: 'captain_anjali', name: 'Captain Anjali', match: ['anjali', 'captain'], image: placeholder('CaptainAnjali') },
  { key: 'narrator', name: 'Narrator', match: ['narrator'], image: placeholder('Narrator') },
  { key: 'dr_kavita', name: 'Dr Kavita', match: ['kavita', 'doctor', 'priya'], image: placeholder('DrKavita') },
  { key: 'kabir', name: 'Kabir', match: ['kabir'], image: placeholder('Kabir') },
  { key: 'arpit_sir', name: 'Arpit Sir (teacher)', match: ['arpit', 'sharma', 'sir', 'teacher', 'board'], image: ARPIT_SIR_IMG },
  { key: 'aarav', name: 'Aarav', match: ['aarav'], image: placeholder('Aarav') },
  { key: 'leo', name: 'Leo', match: ['leo'], image: placeholder('Leo') },
  { key: 'sam', name: 'Sam', match: ['sam'], image: placeholder('Sam') },
  { key: 'ananya', name: 'Ananya', match: ['ananya'], image: placeholder('Ananya') },
  { key: 'sara', name: 'Sara', match: ['sara'], image: placeholder('Sara') },
  { key: 'tara', name: 'Tara', match: ['tara'], image: placeholder('Tara') },
  { key: 'zoe', name: 'Zoe', match: ['zoe'], image: placeholder('Zoe') },
];

const BY_KEY = Object.fromEntries(CHARACTERS.map((c) => [c.key, c]));
const CACHE_KEY = 'hoshiyaar_character_images_v1';

// Admin replacements; the last saved copy is reused so pictures show before the request returns
let overrides = (() => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_) { return {}; }
})();
let loadPromise = null;
const listeners = new Set();

/**
 * Key for a speaker who gets their own picture from Admin → Character Images (characters added by
 * new chapters). It is checked before the keyword matching below, so e.g. "Sharma Uncle" can have
 * a picture of his own instead of matching Arpit Sir on "sharma".
 */
export const speakerKey = (speaker = '') => {
  const slug = String(speaker || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return slug ? `speaker_${slug}` : '';
};

/**
 * True when a speaker name is covered by one of the characters above by their own name (its first
 * match word), not only by a shared word such as "sir" or "sharma". Other speakers get a card of
 * their own in the admin.
 */
export const isNamedCharacter = (speaker = '') => {
  const s = String(speaker || '').toLowerCase().trim();
  const c = findCharacter(s);
  return Boolean(c && s.includes(c.match[0]));
};

export const findCharacter = (speaker = '') => {
  const s = String(speaker || '').toLowerCase().trim();
  if (!s) return null;
  return CHARACTERS.find((c) => c.match.some((m) => s.includes(m))) || null;
};

export const getCharacterImageByKey = (key) => overrides[key] || BY_KEY[key]?.image || ARPIT_SIR_IMG;

/** Picture for a speaker name; unknown speakers get the fallback character's picture. */
export const getCharacterImage = (speaker, fallbackKey = 'arpit_sir') => {
  const own = overrides[speakerKey(speaker)];
  if (own) return own;
  const character = findCharacter(speaker);
  return getCharacterImageByKey(character ? character.key : fallbackKey);
};

export const getCharacterOverrides = () => ({ ...overrides });

/** Apply new replacements (after an admin save) and redraw every screen using pictures. */
export const setCharacterOverrides = (next) => {
  overrides = { ...(next || {}) };
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(overrides)); } catch (_) { }
  listeners.forEach((fn) => fn());
};

export const loadCharacterImages = ({ force = false } = {}) => {
  if (loadPromise && !force) return loadPromise;
  loadPromise = curriculumService.getSetting(SETTING_KEY)
    .then((resp) => {
      const value = resp?.data?.value;
      if (value && typeof value === 'object') setCharacterOverrides(value);
      return getCharacterOverrides();
    })
    .catch(() => getCharacterOverrides());
  return loadPromise;
};

/** Loads the admin's pictures once and re-renders the calling component when they change. */
export const useCharacterImages = () => {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const rerender = () => setVersion((v) => v + 1);
    listeners.add(rerender);
    loadCharacterImages();
    return () => listeners.delete(rerender);
  }, []);
};
