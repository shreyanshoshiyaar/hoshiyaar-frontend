import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import curriculumService from '../../../services/curriculumService';
import authService from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import LessonHeader from '../LessonHeader.jsx';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import { getApiBase } from '../../../utils/apiBase.js';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import { unlockMobileAudio, prefetchTts, waitForTts } from '../../../utils/audioPreloadService.js';
import { getCharacterImage, useCharacterImages } from '../../../utils/characterImages.js';
import { markModuleAsCompleted } from '../../../utils/progressSyncService.js';
import paymentService from '../../../services/paymentService.js';
import { useAccess } from '../../../context/AccessContext.jsx';
import PaywallModal from '../../features/Subscription/PaywallModal.jsx';

const CHARACTER_AVATARS = {
  // Core 4 Characters
  hoshi: "https://res.cloudinary.com/imq5966f/image/upload/v1791543786/img-to-link/rtyoddo8fjqspbtngsri.webp",
  myra: "https://res.cloudinary.com/imq5966f/image/upload/v1791543787/img-to-link/ayqvapvovlppgkniud7k.webp",
  ruhaaan: "https://res.cloudinary.com/imq5966f/image/upload/v1791543788/img-to-link/cgel5nvus6jbhxlbghhu.webp",
  ruhaan: "https://res.cloudinary.com/imq5966f/image/upload/v1791543788/img-to-link/cgel5nvus6jbhxlbghhu.webp",
  bablooo: "https://res.cloudinary.com/imq5966f/image/upload/v1791543789/img-to-link/rqwxrpdymyzbhqd74eiy.webp",
  babloo: "https://res.cloudinary.com/imq5966f/image/upload/v1791543789/img-to-link/rqwxrpdymyzbhqd74eiy.webp",

  // 5 Extra Male Characters
  sharma: "https://res.cloudinary.com/imq5966f/image/upload/c_thumb,g_face,w_400,h_400,z_0.75/v1792746731/img-to-link/qmkyfvxqhrnvo7tyy6ze.jpg",
  arpit: "https://res.cloudinary.com/imq5966f/image/upload/c_thumb,g_face,w_400,h_400,z_0.75/v1792746731/img-to-link/qmkyfvxqhrnvo7tyy6ze.jpg",
  kabir: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kabir",
  aarav: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav",
  leo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
  sam: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sam",

  // 5 Extra Female Characters
  kavita: "https://api.dicebear.com/7.x/adventurer/svg?seed=DrKavita",
  ananya: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya",
  sara: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sara",
  tara: "https://api.dicebear.com/7.x/adventurer/svg?seed=Tara",
  zoe: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe",
  chinki: "https://res.cloudinary.com/imq5966f/image/upload/c_crop,x_25,y_135,w_310,h_310/c_scale,w_300,h_300/v1792740022/img-to-link/bhpngalg3micbma3fjqc.webp",
  lakshmi: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lakshmi",
  farmer: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lakshmi",
  dadi: "https://res.cloudinary.com/imq5966f/image/upload/v1792840515/img-to-link/dee69e93.png"
};

// Design system tokens & CSS variables
const STORY_THEME_VARS = {
  '--ink': '#152238',
  '--ink-2': '#4A5B74',
  '--sky': '#EEF4FB',
  '--paper': '#FFFFFF',
  '--hoshi': '#1F6FE5',
  '--hoshi-deep': '#1550B0',
  '--sun': '#F6BD26',
  '--sun-deep': '#E2A41C',
  '--node': '#F6C916',
  '--node-deep': '#CA8A05',
  '--pillY': '#FACD1C',
  '--pillY-deep': '#E3B010',
  '--brick': '#BF3628',
  '--brick-deep': '#86251E',
  '--story': '#FEFEF6',
  '--hair': '#16151D',
  '--marigold': '#FFD20F',
  '--marigold-deep': '#D9A800',
  '--leaf': '#1F9D63',
  '--leaf-soft': '#DDF5E8',
  '--chili': '#D93A3F',
  '--chili-soft': '#FDE4E4',
  '--cream': '#FBF1DE',
  '--chalk': '#0A0E12',
  '--glow': '#7CD3FF',
  '--gold': '#F2B33D',
  '--line': '#D5E0EC',
  '--backdrop': '#0E1A2B',
  '--f-heading': "'Barlow Condensed', 'Impact', sans-serif",
  '--f-display': "'Barlow Condensed', 'Impact', sans-serif",
  '--f-dialogue': "'Fredoka', 'Trebuchet MS', system-ui, sans-serif",
  '--f-comic': "'Fredoka', 'Trebuchet MS', system-ui, sans-serif",
  '--f-hand': "'Fredoka', system-ui, sans-serif",
  '--f-ui': "'Nunito', system-ui, sans-serif",
  '--f-body': "'Nunito', system-ui, sans-serif",
  '--r': '18px',
  '--ts': '1',
  colorScheme: 'light',
  color: 'var(--ink, #152238)',
  fontFamily: "'Nunito', system-ui, sans-serif"
};

// White box background with distinct slightly darker border themes for speaker dialogue cards
const SPEAKER_THEMES = {
  myra: {
    cardBg: 'bg-white',
    cardBorder: 'border-purple-300',
    activeBorder: 'border-[#A855F7]',
    activeRing: 'ring-purple-200',
    avatarBg: 'bg-purple-100'
  },
  hoshi: {
    cardBg: 'bg-white',
    cardBorder: 'border-blue-300',
    activeBorder: 'border-[#2C6DEF]',
    activeRing: 'ring-blue-200',
    avatarBg: 'bg-blue-100'
  },
  ruhaaan: {
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-300',
    activeBorder: 'border-[#10B981]',
    activeRing: 'ring-emerald-200',
    avatarBg: 'bg-emerald-100'
  },
  bablooo: {
    cardBg: 'bg-white',
    cardBorder: 'border-orange-300',
    activeBorder: 'border-[#F97316]',
    activeRing: 'ring-orange-200',
    avatarBg: 'bg-orange-100'
  },
  // Male Extra Themes
  sharma: {
    cardBg: 'bg-white',
    cardBorder: 'border-teal-400',
    activeBorder: 'border-[#0D9488]',
    activeRing: 'ring-teal-200',
    avatarBg: 'bg-teal-100'
  },
  kabir: {
    cardBg: 'bg-white',
    cardBorder: 'border-sky-400',
    activeBorder: 'border-[#0284C7]',
    activeRing: 'ring-sky-200',
    avatarBg: 'bg-sky-100'
  },
  aarav: {
    cardBg: 'bg-white',
    cardBorder: 'border-amber-400',
    activeBorder: 'border-[#CA8A04]',
    activeRing: 'ring-yellow-200',
    avatarBg: 'bg-yellow-100'
  },
  leo: {
    cardBg: 'bg-white',
    cardBorder: 'border-indigo-400',
    activeBorder: 'border-[#4F46E5]',
    activeRing: 'ring-indigo-200',
    avatarBg: 'bg-indigo-100'
  },
  sam: {
    cardBg: 'bg-white',
    cardBorder: 'border-green-400',
    activeBorder: 'border-[#16A34A]',
    activeRing: 'ring-green-200',
    avatarBg: 'bg-green-100'
  },
  // Female Extra Themes
  kavita: {
    cardBg: 'bg-white',
    cardBorder: 'border-cyan-400',
    activeBorder: 'border-[#0891B2]',
    activeRing: 'ring-cyan-200',
    avatarBg: 'bg-cyan-100'
  },
  ananya: {
    cardBg: 'bg-white',
    cardBorder: 'border-rose-400',
    activeBorder: 'border-[#E11D48]',
    activeRing: 'ring-rose-200',
    avatarBg: 'bg-rose-100'
  },
  sara: {
    cardBg: 'bg-white',
    cardBorder: 'border-fuchsia-400',
    activeBorder: 'border-[#C026D3]',
    activeRing: 'ring-fuchsia-200',
    avatarBg: 'bg-fuchsia-100'
  },
  tara: {
    cardBg: 'bg-white',
    cardBorder: 'border-violet-400',
    activeBorder: 'border-[#7C3AED]',
    activeRing: 'ring-violet-200',
    avatarBg: 'bg-violet-100'
  },
  zoe: {
    cardBg: 'bg-white',
    cardBorder: 'border-lime-400',
    activeBorder: 'border-[#65A30D]',
    activeRing: 'ring-lime-200',
    avatarBg: 'bg-lime-100'
  },
  chinki: {
    cardBg: 'bg-white',
    cardBorder: 'border-fuchsia-300',
    activeBorder: 'border-[#D946EF]',
    activeRing: 'ring-fuchsia-200',
    avatarBg: 'bg-fuchsia-100'
  },
  dadi: {
    cardBg: 'bg-white',
    cardBorder: 'border-amber-300',
    activeBorder: 'border-[#F59E0B]',
    activeRing: 'ring-amber-200',
    avatarBg: 'bg-amber-100'
  },
  lakshmi: {
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-400',
    activeBorder: 'border-[#059669]',
    activeRing: 'ring-emerald-200',
    avatarBg: 'bg-emerald-100'
  }
};

const getSpeakerTheme = (speaker = '') => {
  const s = speaker.toLowerCase().trim();
  if (s.includes('myra')) return { key: 'myra', avatar: CHARACTER_AVATARS.myra, theme: SPEAKER_THEMES.myra };
  if (s.includes('ruhaa') || s.includes('ruhan') || s.includes('ruhaan')) return { key: 'ruhaaan', avatar: CHARACTER_AVATARS.ruhaaan, theme: SPEAKER_THEMES.ruhaaan };
  if (s.includes('babloo') || s.includes('bablooo')) return { key: 'bablooo', avatar: CHARACTER_AVATARS.bablooo, theme: SPEAKER_THEMES.bablooo };
  if (s.includes('chinki') || s.includes('didi')) return { key: 'chinki', avatar: CHARACTER_AVATARS.chinki, theme: SPEAKER_THEMES.chinki };
  if (s.includes('hoshi')) return { key: 'hoshi', avatar: CHARACTER_AVATARS.hoshi, theme: SPEAKER_THEMES.hoshi };
  
  if (s.includes('dadi') || s.includes('nani') || s.includes('grandma') || s.includes('grandmother')) return { key: 'dadi', avatar: CHARACTER_AVATARS.dadi, theme: SPEAKER_THEMES.dadi };
  if (s.includes('lakshmi') || s.includes('farmer')) return { key: 'lakshmi', avatar: CHARACTER_AVATARS.lakshmi, theme: SPEAKER_THEMES.lakshmi };
  if (s.includes('anjali') || s.includes('captain')) return { key: 'anjali', avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=CaptainAnjali", theme: SPEAKER_THEMES.myra };
  if (s.includes('narrator')) return { key: 'narrator', avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Narrator", theme: SPEAKER_THEMES.sharma };
  if (s.includes('kabir')) return { key: 'kabir', avatar: CHARACTER_AVATARS.kabir, theme: SPEAKER_THEMES.kabir };
  if (s.includes('sharma') || s.includes('arpit') || s.includes('sir')) return { key: 'sharma', avatar: CHARACTER_AVATARS.sharma, theme: SPEAKER_THEMES.sharma };
  if (s.includes('aarav')) return { key: 'aarav', avatar: CHARACTER_AVATARS.aarav, theme: SPEAKER_THEMES.aarav };
  if (s.includes('leo')) return { key: 'leo', avatar: CHARACTER_AVATARS.leo, theme: SPEAKER_THEMES.leo };
  if (s.includes('sam')) return { key: 'sam', avatar: CHARACTER_AVATARS.sam, theme: SPEAKER_THEMES.sam };

  if (s.includes('ananya')) return { key: 'ananya', avatar: CHARACTER_AVATARS.ananya, theme: SPEAKER_THEMES.ananya };
  if (s.includes('kavita') || s.includes('priya')) return { key: 'kavita', avatar: CHARACTER_AVATARS.kavita, theme: SPEAKER_THEMES.kavita };
  if (s.includes('sara')) return { key: 'sara', avatar: CHARACTER_AVATARS.sara, theme: SPEAKER_THEMES.sara };
  if (s.includes('tara')) return { key: 'tara', avatar: CHARACTER_AVATARS.tara, theme: SPEAKER_THEMES.tara };
  if (s.includes('zoe')) return { key: 'zoe', avatar: CHARACTER_AVATARS.zoe, theme: SPEAKER_THEMES.zoe };

  return { key: 'hoshi', avatar: CHARACTER_AVATARS.hoshi, theme: SPEAKER_THEMES.hoshi };
};

// Theme from the story's own mapping; picture from the shared, admin-editable character list
const getSpeakerInfo = (speaker = '') => ({ ...getSpeakerTheme(speaker), avatar: getCharacterImage(speaker, 'hoshi') });

function parseStoryScenes(rawItems = [], startIndex = 0) {
  let idx = startIndex;
  const sequenceItems = [];

  const isStopType = (t) => [
    'blackboard', 'blackboard-step', 'board',
    'multiple-choice', 'fill-in-the-blank', 'rearrange',
    'descriptive', 'didyouknow', 'did_you_know', 'did-you-know',
    'concept', 'statement', 'engagement', 'engagement-audio', 'engagement-mcq', 'engagement-rearrange'
  ].includes(String(t || '').toLowerCase());

  while (idx < rawItems.length) {
    const it = rawItems[idx];
    const t = String(it.type || '').toLowerCase();
    
    // Stop if we hit a non-comic/story section (after startIndex)
    if (idx > startIndex && isStopType(t)) {
      break;
    }
    // Also stop if startIndex itself is a stop type (unless it's comic/story)
    if (idx === startIndex && !['comic', 'story'].includes(t)) {
      break;
    }

    sequenceItems.push({ item: it, index: idx });
    idx++;
  }

  const nextSectionIndex = idx;

  const pages = [];
  let currentPage = null;

  for (const { item, index: itemIdx } of sequenceItems) {
    const t = String(item.type || '').toLowerCase();
    const itemId = String(item.itemId || '');
    const txt = item.text || item.question || '';
    const isImageInstruction = txt.toUpperCase().startsWith('INSERT IMAGE:');
    const isPanelOrScene = t === 'comic' || itemId.match(/\.P\d+$/i) || (itemId.match(/\.S\d+$/i) && !itemId.match(/\.D\d+/i));

    if (isPanelOrScene || !currentPage) {
      if (currentPage && (currentPage.elements.length > 0 || currentPage.sceneImage)) {
        pages.push(currentPage);
      }
      
      let title = item.cardTitle || (isImageInstruction ? txt.replace(/^INSERT IMAGE:\s*/i, '') : txt) || `Scene ${pages.length + 1}`;
      let image = null;
      if (item.images && item.images.length > 0) {
        image = item.images[0];
      } else if (item.imageUrl) {
        image = item.imageUrl;
      }

      currentPage = {
        partTitle: title,
        caption: "MISSION COMIC",
        sceneImage: image,
        elements: []
      };

      // If this comic item actually has spoken text or dialogue
      if (!isImageInstruction && (item.speaker || (txt && t === 'story'))) {
        currentPage.elements.push({
          id: item._id || itemIdx,
          type: 'dialogue',
          speaker: item.speaker || 'Hoshi',
          text: txt
        });
      }
    } else {
      // It's a dialogue / story item inside current scene
      const cleanText = isImageInstruction ? '' : txt;
      if (cleanText) {
        currentPage.elements.push({
          id: item._id || itemIdx,
          type: 'dialogue',
          speaker: item.speaker || 'Hoshi',
          text: cleanText
        });
      }
      if (!currentPage.sceneImage) {
        if (item.images && item.images.length > 0) currentPage.sceneImage = item.images[0];
        else if (item.imageUrl) currentPage.sceneImage = item.imageUrl;
      }
    }
  }

  if (currentPage && (currentPage.elements.length > 0 || currentPage.sceneImage)) {
    pages.push(currentPage);
  }

  return { pages, nextSectionIndex };
}

export default function StoryMode() {
  useCharacterImages(); // redraw when admin-edited character pictures load
  const params = useParams();
  const targetModuleId = params.moduleNumber || params.moduleId;
  const startIndex = parseInt(params.index || '0', 10) || 0;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const isAdmin = Boolean(
    user?.role === 'admin' || 
    user?.role === 'master' || 
    ['Host', 'hostcbse', 'AKSHITRAVULA', 'AKSHIT', 'SB10', 'Nidhi sekhri'].includes(user?.username) || 
    ['9867735936', '7021970672', '9820277252', '8310532323'].some(p => String(user?.phone || '').replace(/\D/g, '').endsWith(p))
  );

  const chapterId = searchParams.get('chapterId') || '';
  const unitId = searchParams.get('unitId') || '';

  const [loading, setLoading] = useState(true);
  // Set when the trial has ended and this story was not played in it
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  const [accessAttempt, setAccessAttempt] = useState(0);
  const { setAccess } = useAccess();
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [rawItemsState, setRawItemsState] = useState([]);
  const [nextSectionIndex, setNextSectionIndex] = useState(0);

  // Audio / TTS state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const [durationSec, setDurationSec] = useState(18);
  const [currentSec, setCurrentSec] = useState(0);
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [isAudioMinimized, setIsAudioMinimized] = useState(false);

  // Auto-scroll refs
  const scrollContainerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    setShowScrollCue(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPageIndex]);

  // Fetch or setup rich story scenes
  useEffect(() => {
    let isMounted = true;
    async function loadStory() {
      try {
        setLoading(true);

        let parsedPages = [];
        let nextIdx = 0;

        // If not a demo slug, load from backend
        if (targetModuleId && targetModuleId !== 'demo') {
          // Stories open straight from the chapter map, so count the lesson against the
          // trial here (as ModuleEntryRedirect does for other lessons) before loading it
          try {
            const started = await paymentService.startLesson(targetModuleId);
            if (!isMounted) return;
            if (started?.access) setAccess(started.access);
            if (started?.hasAccess === false) {
              setPaywallBlocked(true);
              setLoading(false);
              return;
            }
          } catch (_) {
            // Network trouble: carry on; the lesson content endpoint still enforces access
          }
          try {
            const resp = await curriculumService.listCurriculumItems(targetModuleId);
            const rawItems = resp?.data || [];
            if (rawItems.length > 0) {
              const isNew = isNewStyleStory({
                items: rawItems,
                chapterId,
                chapterTitle: searchParams.get('chapterTitle') || searchParams.get('title')
              });
              if (!isNew) {
                const searchSuffix = window.location.search || '';
                navigate(`/learn/module/${targetModuleId}/concept/${startIndex}${searchSuffix}`, { replace: true });
                return;
              }
              setRawItemsState(rawItems);
              const result = parseStoryScenes(rawItems, startIndex);
              parsedPages = result.pages;
              nextIdx = result.nextSectionIndex;
              setNextSectionIndex(nextIdx);
            }
          } catch (e) {
            console.warn("Could not fetch remote items, using demo story:", e);
          }
        }

        // Only load rich story demo if this is explicitly a demo route
        if (targetModuleId === 'demo' && parsedPages.length === 0) {
          parsedPages = [
            {
              partTitle: "The Clinic Visit",
              caption: "MISSION INTEL",
              sceneImage: "https://res.cloudinary.com/fhscvc7p/image/upload/v1791975544/img-to-link/s3nfwa9j64jx4orq5kuj.webp",
              elements: [
                {
                  id: 1,
                  type: "dialogue",
                  speaker: "Bablooo",
                  text: "This plain chapati tastes sweet! But the mouth only chews. Real digestion starts in the stomach."
                },
                {
                  id: 2,
                  type: "dialogue",
                  speaker: "Myra",
                  text: "Then why does Dr. Sharma say digestion begins right in the mouth, Bablooo?"
                },
                {
                  id: 3,
                  type: "dialogue",
                  speaker: "Hoshi",
                  text: "Because saliva breaks down starch into sweet sugars! That is why chapati tastes sweet."
                },
                {
                  id: 4,
                  type: "dialogue",
                  speaker: "Dr. Sharma",
                  text: "Spot on, Hoshi! The lungs oxygenate your blood, while the stomach processes your lunch."
                },
                {
                  id: 5,
                  type: "dialogue",
                  speaker: "Dr. Kavita",
                  text: "And taking deep breaths helps your heart pump oxygen all across your body!"
                }
              ]
            },
            {
              partTitle: "The Energy Challenge",
              caption: "MISSION INTEL",
              sceneImage: "https://res.cloudinary.com/fhscvc7p/image/upload/v1791471865/img-to-link/uhsp40oydukd1h9elj2d.webp",
              elements: [
                {
                  id: 6,
                  type: "dialogue",
                  speaker: "Ruhaaan",
                  text: "Check this out! If we sprint right after eating, does our energy jump instantly?"
                },
                {
                  id: 7,
                  type: "dialogue",
                  speaker: "Kabir",
                  text: "I tried that before! My legs felt super heavy when I tried running right after eating."
                },
                {
                  id: 8,
                  type: "dialogue",
                  speaker: "Ananya",
                  text: "That is because your body redirects blood flow to your stomach to help digest food first."
                },
                {
                  id: 9,
                  type: "dialogue",
                  speaker: "Aarav",
                  text: "So that is why professional athletes always eat their meals well in advance before a game!"
                },
                {
                  id: 10,
                  type: "dialogue",
                  speaker: "Sara",
                  text: "Exactly! Proper timing gives you superhero stamina when you run!"
                }
              ]
            },
            {
              partTitle: "The Science Lab Discovery",
              caption: "MISSION INTEL",
              sceneImage: "https://res.cloudinary.com/fhscvc7p/image/upload/v1791975544/img-to-link/s3nfwa9j64jx4orq5kuj.webp",
              elements: [
                {
                  id: 11,
                  type: "dialogue",
                  speaker: "Leo",
                  text: "Our lab sensors show digestion breaks complex food into tiny glucose molecules."
                },
                {
                  id: 12,
                  type: "dialogue",
                  speaker: "Tara",
                  text: "And then glucose travels through our bloodstream like tiny fuel packets for our cells!"
                },
                {
                  id: 13,
                  type: "dialogue",
                  speaker: "Sam",
                  text: "Wait, so is water absorbed in the stomach or further down the system?"
                },
                {
                  id: 14,
                  type: "dialogue",
                  speaker: "Zoe",
                  text: "Most water is absorbed in the large intestine to keep us completely hydrated!"
                }
              ]
            }
          ];
        }

        if (isMounted) {
          setPages(parsedPages);
          setDurationSec(Math.max(12, (parsedPages[0]?.elements?.length || 1) * 4));
        }
      } catch (err) {
        console.error("Story load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStory();
    return () => {
      isMounted = false;
      stopAudio();
    };
  }, [targetModuleId, startIndex, accessAttempt]);

  const currentPage = pages[currentPageIndex] || pages[0];
  const rawElements = currentPage?.elements || [];
  // Include all dialogue and narrative cards in order
  const elements = rawElements.filter(item => {
    const txt = (item.text || '').toLowerCase();
    if (txt.includes('detective squad took notes') || txt.includes('squad understood how digestion')) return false;
    return true;
  });

  // HTML5 Audio Reference
  const audioRef = useRef(null);
  const activeIndexRef = useRef(-1);
  const retryTimeoutRef = useRef(null);
  const touchListenerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const handleGlobalStop = () => stopAudio();
    window.addEventListener('hoshiyaar:stop_audio', handleGlobalStop);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('hoshiyaar:stop_audio', handleGlobalStop);
      stopAudio();
    };
  }, []);

  // Scalable on-the-fly streaming audio URL (zero static files, infinite comics support)
  const getAudioSource = (element) => {
    if (element.audioUrl) return element.audioUrl;
    const cleanText = (element.text || '').replace(/["*]/g, '').trim();
    const speaker = element.speaker || 'Arpit Sir';
    const apiBase = getApiBase();
    return `${apiBase}/api/ai/tts?text=${encodeURIComponent(cleanText)}&speaker=${encodeURIComponent(speaker)}&v=15`;
  };

  // Calculate flexible duration for an item based on its word count
  const getItemEstimatedDuration = (text) => {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.ceil(words / 2.2 + 0.8));
  };

  // Calculate dynamic page duration as sum of items adjusted by speed
  const calculateTotalDuration = (elems, speed = 1.0) => {
    if (!elems || elems.length === 0) return 12;
    const rawTotal = elems.reduce((acc, el) => acc + getItemEstimatedDuration(el.text), 0);
    return Math.max(6, Math.round(rawTotal / speed));
  };

  // Automatically adapt total audio duration to current page's text length and playback speed
  useEffect(() => {
    if (currentPage?.elements) {
      const dynamicDuration = calculateTotalDuration(currentPage.elements, playbackSpeed);
      setDurationSec(dynamicDuration);
    }
  }, [currentPageIndex, pages, playbackSpeed]);

  const stopAudio = () => {
    setIsPaused(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (touchListenerRef.current) {
      window.removeEventListener('click', touchListenerRef.current);
      window.removeEventListener('touchstart', touchListenerRef.current);
      touchListenerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      } catch (_) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    setIsPlaying(false);
  };

  const playLineAudio = (index) => {
    if (index >= elements.length) {
      stopAudio();
      setActiveItemIndex(-1);
      setCurrentSec(durationSec);
      return;
    }

    const currentElem = elements[index];
    if (!currentElem || !currentElem.text) {
      playLineAudio(index + 1);
      return;
    }

    // Stop prior audio and pending retries cleanly
    stopAudio();

    setActiveItemIndex(index);
    activeIndexRef.current = index;
    setIsPlaying(true);
    setIsPaused(false);

    // Download the next lines into memory now so line-to-line changes have no loading gap
    elements.slice(index + 1, index + 4).forEach((nextElem, i) => {
      if (nextElem && nextElem.text) prefetchTts(getAudioSource(nextElem), { priority: i === 0 });
    });

    if (itemRefs.current[index]) {
      itemRefs.current[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const audioUrl = getAudioSource(currentElem);
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const baseOffset = elements.slice(0, index).reduce((acc, el) => acc + getItemEstimatedDuration(el.text), 0);

    audio.ontimeupdate = () => {
      const currentTrackTime = audio.currentTime;
      const totalElapsed = (baseOffset + currentTrackTime) / playbackSpeed;
      setCurrentSec(Math.min(durationSec, Math.round(totalElapsed)));
    };

    audio.onended = () => {
      // Advance to next line if still mounted
      if (isMountedRef.current && activeIndexRef.current === index) {
        playLineAudio(index + 1);
      }
    };

    audio.onerror = (e) => {
      console.warn('Audio error on line:', index, e);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && activeIndexRef.current === index) {
          playLineAudio(index + 1);
        }
      }, 2000);
    };

    // Play from the in-memory copy; if this line is still downloading, reuse that download
    waitForTts(audioUrl).then((src) => {
      if (!isMountedRef.current || audioRef.current !== audio) return;
      audio.src = src;
      audio.playbackRate = playbackSpeed; // setting src resets playbackRate
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio autoplay blocked by browser policy, listening for first touch:', err);
          unlockMobileAudio();
          if (touchListenerRef.current) {
            window.removeEventListener('click', touchListenerRef.current);
            window.removeEventListener('touchstart', touchListenerRef.current);
          }
          const onFirstTouch = () => {
            window.removeEventListener('click', onFirstTouch);
            window.removeEventListener('touchstart', onFirstTouch);
            touchListenerRef.current = null;
            if (isMountedRef.current && activeIndexRef.current === index && audioRef.current === audio) {
              audio.play().catch(() => {});
            }
          };
          touchListenerRef.current = onFirstTouch;
          window.addEventListener('click', onFirstTouch, { once: true });
          window.addEventListener('touchstart', onFirstTouch, { once: true });
        });
      }
    });
  };

  // Autoplay audio whenever the comic scene finishes loading or advances to next scene/page
  useEffect(() => {
    if (loading || !elements || elements.length === 0) return;

    // Queue every line of the scene in order; the first lines arrive first
    elements.forEach(el => { if (el && el.text) prefetchTts(getAudioSource(el)); });

    const autoplayTimer = setTimeout(() => {
      playLineAudio(0);
    }, 400);

    return () => {
      clearTimeout(autoplayTimer);
      stopAudio();
    };
  }, [loading, currentPageIndex, pages.length]);

  const togglePlayStop = () => {
    if (isPlaying) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (_) {}
      }
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      if (isPaused && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setIsPaused(false);
        }).catch(() => {
          const target = activeIndexRef.current >= 0 ? activeIndexRef.current : 0;
          playLineAudio(target);
        });
      } else {
        const target = activeIndexRef.current >= 0 ? activeIndexRef.current : 0;
        playLineAudio(target);
      }
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed === 1.0 ? 1.15 : playbackSpeed === 1.15 ? 1.25 : playbackSpeed === 1.25 ? 0.9 : 1.0;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleContinue = async () => {
    stopAudio();
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      setActiveItemIndex(-1);
      setCurrentSec(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const query = window.location.search || '';

    // If there is a next section in the module:
    if (rawItemsState && rawItemsState.length > 0 && nextSectionIndex < rawItemsState.length) {
      const nextItem = rawItemsState[nextSectionIndex];
      const nextType = String(nextItem?.type || '').toLowerCase();

      if (['blackboard', 'blackboard-step', 'board'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/blackboard/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'multiple-choice') {
        navigate(`/learn/module/${targetModuleId}/mcq/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'fill-in-the-blank') {
        navigate(`/learn/module/${targetModuleId}/fillups/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'rearrange') {
        navigate(`/learn/module/${targetModuleId}/rearrange/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'descriptive') {
        navigate(`/learn/module/${targetModuleId}/descriptive/${nextSectionIndex}${query}`);
        return;
      }
      if (['didyouknow', 'did_you_know', 'did-you-know', 'remember'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/didyouknow/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType.startsWith('engagement')) {
        navigate(`/learn/module/${targetModuleId}/engagement/${nextSectionIndex}${query}`);
        return;
      }
      if (['comic', 'story'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/story/${nextSectionIndex}${query}`);
        return;
      }
      if (['concept', 'statement'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/concept/${nextSectionIndex}${query}`);
        return;
      }
    }

    // Save module completion to progress
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser?._id && targetModuleId && targetModuleId !== 'demo') {
        authService.updateProgress({
          userId: currentUser._id,
          moduleId: String(targetModuleId),
          subject: currentUser.subject || 'Science',
          conceptCompleted: true
        });
      }
    } catch (e) {
      console.debug('Could not update progress:', e);
    }

    // If no more items or completed, navigate to lesson complete or learn dashboard
    if (rawItemsState && rawItemsState.length > 0 && (nextSectionIndex >= rawItemsState.length || isMissionCompleteItem(rawItemsState[nextSectionIndex]))) {
      markModuleAsCompleted({
        userId: user?._id,
        subject: user?.subject || 'Science',
        chapterId,
        unitId,
        moduleId: targetModuleId
      });
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(targetModuleId));
      completionParams.set('chapter', String(targetModuleId));
      if (chapterId) completionParams.set('chapterId', chapterId);
      if (unitId) completionParams.set('unitId', unitId);
      navigate(`/lesson-complete?${completionParams.toString()}`);
      return;
    }

    const params = new URLSearchParams();
    if (chapterId) params.set('chapterId', chapterId);
    if (unitId) params.set('unitId', unitId);
    navigate(`/learn${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleExit = () => {
    stopAudio();
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      setActiveItemIndex(-1);
      setCurrentSec(0);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    navigate(`/learn${suffix}`);
  };

  const handleScrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  // Stage skip: skips the entire comic stage directly to the next section
  const handleStageSkip = () => {
    stopAudio();
    const query = window.location.search || '';

    // If there is a next section in the module, jump immediately past all comic pages
    if (rawItemsState && rawItemsState.length > 0 && nextSectionIndex < rawItemsState.length) {
      const nextItem = rawItemsState[nextSectionIndex];
      const nextType = String(nextItem?.type || '').toLowerCase();

      if (['blackboard', 'blackboard-step', 'board'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/blackboard/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'multiple-choice') {
        navigate(`/learn/module/${targetModuleId}/mcq/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'fill-in-the-blank') {
        navigate(`/learn/module/${targetModuleId}/fillups/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'rearrange') {
        navigate(`/learn/module/${targetModuleId}/rearrange/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType === 'descriptive') {
        navigate(`/learn/module/${targetModuleId}/descriptive/${nextSectionIndex}${query}`);
        return;
      }
      if (['didyouknow', 'did_you_know', 'did-you-know', 'remember'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/didyouknow/${nextSectionIndex}${query}`);
        return;
      }
      if (nextType.startsWith('engagement')) {
        navigate(`/learn/module/${targetModuleId}/engagement/${nextSectionIndex}${query}`);
        return;
      }
      if (['concept', 'statement'].includes(nextType)) {
        navigate(`/learn/module/${targetModuleId}/concept/${nextSectionIndex}${query}`);
        return;
      }
    }

    // If last stage, proceed to completion
    if (rawItemsState && rawItemsState.length > 0 && (nextSectionIndex >= rawItemsState.length || isMissionCompleteItem(rawItemsState[nextSectionIndex]))) {
      markModuleAsCompleted({
        userId: user?._id,
        subject: user?.subject || 'Science',
        chapterId,
        unitId,
        moduleId: targetModuleId
      });
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(targetModuleId));
      completionParams.set('chapter', String(targetModuleId));
      if (chapterId) completionParams.set('chapterId', chapterId);
      if (unitId) completionParams.set('unitId', unitId);
      navigate(`/lesson-complete?${completionParams.toString()}`);
      return;
    }

    const params = new URLSearchParams();
    if (chapterId) params.set('chapterId', chapterId);
    if (unitId) params.set('unitId', unitId);
    navigate(`/learn${params.toString() ? '?' + params.toString() : ''}`);
  };

  if (paywallBlocked) {
    const backToMap = () => {
      const params = new URLSearchParams();
      if (chapterId) params.set('chapterId', chapterId);
      if (unitId) params.set('unitId', unitId);
      navigate(`/learn${params.toString() ? '?' + params.toString() : ''}`, { replace: true });
    };
    return (
      <div className="fixed inset-0 bg-[#F0F6FF]">
        <PaywallModal
          isOpen
          onClose={backToMap}
          onSuccess={() => { setPaywallBlocked(false); setAccessAttempt(n => n + 1); }}
        />
      </div>
    );
  }

  if (loading || !currentPage) {
    return (
      <div className="h-screen bg-[#FEFEF6] flex flex-col justify-center items-center">
        <SimpleLoading text="Loading comic scene..." />
      </div>
    );
  }

  const totalModuleItems = Math.max(1, rawItemsState?.length || pages.length);
  const currentModuleItemIndex = Math.min(startIndex + currentPageIndex, totalModuleItems - 1);
  const stageInfo = getStageInfoForIndex(rawItemsState, currentModuleItemIndex);

  return (
    <div 
      style={STORY_THEME_VARS}
      className="h-screen max-h-[100dvh] bg-[#FEFEF6] text-[#152238] flex justify-center selection:bg-blue-100 overflow-hidden font-sans"
    >
      {/* Responsive container (Spacious 2-column layout on desktop, stacked on mobile) */}
      <div className="w-full max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-full flex flex-col bg-[#FEFEF6] relative md:shadow-2xl md:border-x border-[#D5E0EC] overflow-hidden">
        
        {/* ── TOP APP BAR (UNIFIED LESSON HEADER) ── */}
        <div className="flex-shrink-0 bg-[#FEFEF6]/95 backdrop-blur-md border-b border-[#D5E0EC] z-40">
          <LessonHeader
            onBack={handleExit}
            title={currentPage?.caption || "MISSION INTEL"}
            currentIndex={currentModuleItemIndex}
            total={totalModuleItems}
            stageInfo={stageInfo}
            theme="light"
            onSkip={handleStageSkip}
            canMasterSkip={isAdmin}
            rightExtra={
              <ReportFlagButton
                itemId={currentPage?._id || currentPage?.itemId || `story-page-${currentPageIndex}`}
                moduleId={targetModuleId || ''}
                chapterId={chapterId || ''}
                questionText={`Comic Scene: ${currentPage?.caption || 'Story Dialogue'}`}
                screenName={`Comic Page ${currentPageIndex + 1}`}
                className="w-8 h-8 sm:w-9 sm:h-9"
              />
            }
          />
        </div>

        {/* ── MAIN CONTENT (2 COLUMNS ON DESKTOP TO AVOID SCROLL, STACKED ON MOBILE) ── */}
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-6 p-2.5 sm:p-5 md:p-6 overflow-hidden min-h-0">
          
          {/* LEFT COLUMN: Dedicated Big Image Box (ONLY 1 IMAGE, NO TEXT) - Responsively scaled with dvh so dialogue fits on all phone heights */}
          <div className="w-full md:w-1/2 lg:w-7/12 flex-shrink-0 flex flex-col items-center justify-center min-h-0 md:h-full my-auto self-center">
            <div className="relative w-full h-[26dvh] min-h-[160px] max-h-[240px] sm:h-[32dvh] sm:min-h-[220px] sm:max-h-[320px] md:h-full md:max-h-[calc(100vh-170px)] rounded-[18px] overflow-hidden border-2 border-[#CFCDC6] shadow-[0_4px_0_#CFCDC6] bg-[#0E1A2B] flex items-center justify-center">
              {currentPage?.sceneImage ? (
                <img 
                  src={currentPage.sceneImage} 
                  alt={currentPage.partTitle || "Story Scene"} 
                  className="w-full h-full object-cover object-center select-none block"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-2 p-4 text-center">
                  <span className="text-3xl">🎨</span>
                  <span className="text-xs font-bold uppercase tracking-wider">{currentPage?.partTitle || "Comic Scene"}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Dialogue Cards + Docked Desktop Audio Player & Continue */}
          <div className="flex-1 flex flex-col md:w-1/2 lg:w-5/12 min-h-0 md:h-full mt-2 sm:mt-3 md:mt-0 relative justify-between">
            {/* Dialogue Cards list */}
            <div 
              ref={scrollContainerRef}
              onScroll={(e) => {
                if (e.currentTarget.scrollTop > 40) {
                  if (showScrollCue) setShowScrollCue(false);
                } else {
                  if (!showScrollCue) setShowScrollCue(true);
                }
              }}
              className="flex-1 overflow-y-auto flex flex-col gap-2.5 sm:gap-3.5 p-1 pr-1 md:pr-2 pb-3 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {elements.map((item, idx) => {
                const { avatar, key: speakerKey } = getSpeakerInfo(item.speaker);
                const isActive = activeItemIndex === idx;

                const getSpeakerTextColor = (key = '') => {
                  const k = String(key || item.speaker || '').toLowerCase();
                  if (k.includes('myra')) return 'text-[#7C3AED]'; // Vibrant purple
                  if (k.includes('chinki') || k.includes('didi')) return 'text-[#D946EF]'; // Vibrant magenta / rose for Chinki Didi
                  if (k.includes('ruhaa') || k.includes('ruhan')) return 'text-[#059669]'; // Vibrant green
                  if (k.includes('sharma') || k.includes('arpit') || k.includes('sir')) return 'text-[#0D9488]'; // Teal
                  return 'text-[#1E65FA]'; // Bright vibrant blue (Babloo, Hoshi, etc.)
                };

                return (
                  <div
                    key={item.id || idx}
                    ref={el => (itemRefs.current[idx] = el)}
                    onClick={() => playLineAudio(idx)}
                    style={{
                      fontFamily: "var(--f-body, 'Nunito', sans-serif)",
                      transition: "transform .5s cubic-bezier(.2,.9,.3,1), opacity .5s, box-shadow .2s"
                    }}
                    className={`w-full flex items-center gap-2.5 sm:gap-[14px] p-2.5 sm:p-3.5 rounded-[16px] sm:rounded-[18px] cursor-pointer bg-white select-none border-2 ${
                      isActive 
                        ? 'border-[#1F6FE5] shadow-[0_4px_16px_rgba(31,111,229,0.18)] -translate-y-0.5 ring-2 ring-[#7CD3FF]/50' 
                        : 'border-[#CFCDC6] shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#4A5B74]/50 hover:shadow-sm'
                    }`}
                  >
                    {/* Speaker Avatar Thumbnail */}
                    <div className="flex-shrink-0 w-11 h-11 sm:w-16 sm:h-16 rounded-[12px] sm:rounded-[14px] overflow-hidden shadow-sm border border-[#CFCDC6]/70 bg-[#EEF4FB] relative">
                      <img 
                        src={avatar} 
                        alt={item.speaker} 
                        className="w-full h-full object-cover select-none"
                      />
                    </div>

                    {/* Dialogue Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span 
                          style={{ fontFamily: "'Fredoka', Trebuchet MS, sans-serif" }}
                          className={`block text-[16px] sm:text-[22px] md:text-[23px] font-bold leading-tight tracking-tight ${getSpeakerTextColor(speakerKey)}`}
                        >
                          {item.speaker || "Myra"}
                        </span>
                        {isActive && isPlaying && (
                          <span 
                            style={{ fontFamily: "'Nunito', sans-serif" }}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#1F6FE5] bg-[#EEF4FB] px-2 py-0.5 rounded-full border border-[#D5E0EC] animate-pulse"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FE5]"></span>
                            <span>Speaking</span>
                          </span>
                        )}
                      </div>
                      <p 
                        style={{ 
                          fontFamily: "'Fredoka', Trebuchet MS, sans-serif",
                          lineHeight: "1.32",
                          color: "#152238"
                        }}
                        className="text-[15px] sm:text-[18px] md:text-[19px] font-medium leading-[1.32] text-[#152238] select-text"
                      >
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Docked Audio & Scroll Controller Row + Continue */}
            <div className="hidden md:flex flex-col gap-2.5 pt-3 border-t border-[#D5E0EC] flex-shrink-0">
              <div className="flex items-center gap-2.5 w-full">
                {/* Audio Bar (Expandable & Minimizable) */}
                {!isAudioMinimized ? (
                  <div className="flex-1 min-w-0 bg-white/95 backdrop-blur-md rounded-[18px] border-2 border-[#CFCDC6] shadow-[0_2px_0_#CFCDC6] p-2 flex items-center justify-between gap-2.5 transition-all">
                    <button
                      onClick={togglePlayStop}
                      aria-label={isPlaying ? "Stop audio" : "Play audio"}
                      className={`w-9 h-9 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0 ${
                        isPlaying ? 'bg-amber-500 hover:bg-amber-600' 
                          : 'bg-[#1F6FE5] hover:bg-[#185BC5]'
                      }`}
                    >
                      {isPlaying ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <rect x="6" y="5" width="4" height="14" rx="1.5" />
                      <rect x="14" y="5" width="4" height="14" rx="1.5" />
                    </svg>
                  ) : (
                        <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-bold text-[#152238] font-mono flex-shrink-0">
                        00:{currentSec < 10 ? `0${currentSec}` : currentSec}
                      </span>
                      <div className="flex-1 h-2 bg-[#EEF4FB] rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-[#1F6FE5] rounded-full transition-all relative"
                          style={{ width: `${Math.min(100, (currentSec / durationSec) * 100)}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#1F6FE5] rounded-full shadow" />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#4A5B74] font-mono flex-shrink-0">
                        00:{durationSec < 10 ? `0${durationSec}` : durationSec}
                      </span>
                    </div>

                    <button
                      onClick={toggleSpeed}
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                      className="bg-[#1F6FE5] hover:bg-[#1550B0] active:scale-95 text-white font-bold text-xs px-2.5 py-1 rounded-[10px] border border-[#1550B0] shadow-sm transition-transform flex-shrink-0"
                    >
                      {playbackSpeed}x
                    </button>

                    {/* Minimize Button */}
                    <button
                      onClick={() => setIsAudioMinimized(true)}
                      title="Minimize audio bar"
                      aria-label="Minimize audio player"
                      className="w-8 h-8 rounded-[10px] hover:bg-[#EEF4FB] active:scale-95 text-[#4A5B74] hover:text-[#152238] flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 bg-white/95 backdrop-blur-md rounded-[18px] border-2 border-[#CFCDC6] shadow-[0_2px_0_#CFCDC6] p-2 px-3 flex items-center justify-between gap-2.5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={togglePlayStop}
                        aria-label={isPlaying ? "Stop audio" : "Play audio"}
                        className={`w-9 h-9 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0 ${
                          isPlaying ? 'bg-amber-500 hover:bg-amber-600' 
                            : 'bg-[#1F6FE5] hover:bg-[#185BC5]'
                        }`}
                      >
                        {isPlaying ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <rect x="5" y="5" width="14" height="14" rx="2" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <span 
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                        className="text-xs font-bold text-[#152238] truncate"
                      >
                        {isPlaying ? "Playing Story Audio..." : "Story Audio"}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAudioMinimized(false)}
                      title="Expand audio player"
                      aria-label="Expand audio player"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                      className="bg-[#EEF4FB] hover:bg-slate-200 text-[#152238] text-xs font-bold px-2.5 py-1.5 rounded-[10px] flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                    >
                      <span>Expand</span>
                      <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Scroll Down Button (Double chevron scroll cue, not download arrow) */}
                <button
                  onClick={handleScrollDown}
                  title="Scroll Down"
                  aria-label="Scroll down"
                  className="w-[52px] h-[52px] bg-white hover:bg-[#EEF4FB] active:translate-y-[1px] active:shadow-none backdrop-blur-md rounded-[18px] border-2 border-[#CFCDC6] shadow-[0_2px_0_#CFCDC6] flex items-center justify-center text-[#152238] transition-all flex-shrink-0 group"
                >
                  <svg 
                    className="w-5 h-5 stroke-[2.5] text-[#152238] transform group-hover:translate-y-0.5 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l5 5 5-5M7 13l5 5 5-5" />
                  </svg>
                </button>
              </div>

              {/* Desktop Continue button (Hoshi Blue - Barlow Condensed ExtraBold Italic) */}
              <button
                onClick={handleContinue}
                style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}
                className="w-full relative py-3 px-4 rounded-[16px] bg-[#1F6FE5] hover:bg-[#185BC5] active:bg-[#1550B0] active:translate-y-[1px] transition-transform shadow-[0_4px_0_#1550B0] border-2 border-[#7CD3FF]/60 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span className="text-white text-xl sm:text-2xl font-black italic tracking-wider uppercase drop-shadow-sm flex items-center justify-center gap-2">
                  <span>➔</span>
                  <span>CONTINUE</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE ONLY: DOCKED BOTTOM CONTROLLER & CONTINUE BAR ── */}
        <div className="md:hidden flex-shrink-0 bg-[#FEFEF6] px-3 pt-2 pb-3 border-t border-[#D5E0EC] z-40 flex flex-col gap-2">
          <div className="flex items-center gap-2 w-full">
            {/* Mobile Audio Bar (Expandable & Minimizable) */}
            {!isAudioMinimized ? (
              <div className="flex-1 min-w-0 bg-white backdrop-blur-md rounded-[18px] border-2 border-[#CFCDC6] shadow-[0_2px_0_#CFCDC6] p-1.5 flex items-center justify-between gap-1.5 transition-all">
                <button
                  onClick={togglePlayStop}
                  aria-label={isPlaying ? "Stop audio" : "Play audio"}
                  className={`w-9 h-9 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0 ${
                    isPlaying ? 'bg-amber-500 hover:bg-amber-600' 
                      : 'bg-[#1F6FE5] hover:bg-[#185BC5]'
                  }`}
                >
                  {isPlaying ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-[#152238] font-mono flex-shrink-0">
                    00:{currentSec < 10 ? `0${currentSec}` : currentSec}
                  </span>
                  <div className="flex-1 h-1.5 bg-[#EEF4FB] rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-[#1F6FE5] rounded-full transition-all relative"
                      style={{ width: `${Math.min(100, (currentSec / durationSec) * 100)}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#1F6FE5] rounded-full shadow" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#4A5B74] font-mono flex-shrink-0">
                    00:{durationSec < 10 ? `0${durationSec}` : durationSec}
                  </span>
                </div>

                <button
                  onClick={toggleSpeed}
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  className="bg-[#1F6FE5] hover:bg-[#1550B0] active:scale-95 text-white font-bold text-[10px] px-2 py-1 rounded-[8px] border border-[#1550B0] shadow-sm transition-transform flex-shrink-0"
                >
                  {playbackSpeed}x
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsAudioMinimized(true)}
                  title="Minimize audio bar"
                  aria-label="Minimize audio player"
                  className="w-7 h-7 rounded-full hover:bg-[#EEF4FB] active:scale-95 text-[#4A5B74] hover:text-[#152238] flex items-center justify-center transition-all flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex-1 min-w-0 bg-white backdrop-blur-md rounded-[18px] border-2 border-[#CFCDC6] shadow-[0_2px_0_#CFCDC6] p-1.5 px-3 flex items-center justify-between gap-2 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={togglePlayStop}
                    aria-label={isPlaying ? "Stop audio" : "Play audio"}
                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0 ${
                      isPlaying ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-[#1F6FE5] hover:bg-[#185BC5]'
                    }`}
                  >
                    {isPlaying ? (
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <rect x="6" y="5" width="4" height="14" rx="1.5" />
                        <rect x="14" y="5" width="4" height="14" rx="1.5" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <span 
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                    className="text-[11px] font-bold text-[#152238] truncate"
                  >
                    {isPlaying ? "Playing..." : "Story Audio"}
                  </span>
                </div>
                <button
                  onClick={() => setIsAudioMinimized(false)}
                  title="Expand audio player"
                  aria-label="Expand audio player"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  className="bg-[#EEF4FB] hover:bg-slate-200 text-[#152238] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                >
                  <span>Expand</span>
                  <svg className="w-3 h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mobile Scroll Down Button (Double chevron scroll cue, not download arrow) */}
            <button
              onClick={handleScrollDown}
              title="Scroll Down"
              aria-label="Scroll down"
              className="w-[46px] h-[46px] bg-white hover:bg-[#EEF4FB] active:translate-y-[1px] active:shadow-none backdrop-blur-md rounded-[16px] border-2 border-[#CFCDC6] shadow-[0_2px_0_#CFCDC6] flex items-center justify-center text-[#152238] transition-all flex-shrink-0 group"
            >
              <svg 
                className="w-4 h-4 stroke-[2.5] text-[#152238] transform group-hover:translate-y-0.5 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l5 5 5-5M7 13l5 5 5-5" />
              </svg>
            </button>
          </div>

          {/* Mobile Continue button (Barlow Condensed ExtraBold Italic) */}
          <button
            onClick={handleContinue}
            style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}
            className="w-full relative py-3 px-4 rounded-[16px] bg-[#1F6FE5] hover:bg-[#185BC5] active:bg-[#1550B0] active:translate-y-[1px] transition-transform shadow-[0_4px_0_#1550B0] border-2 border-[#7CD3FF]/60 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span className="text-white text-xl sm:text-2xl font-black italic tracking-wider uppercase drop-shadow-sm flex items-center justify-center gap-2">
              <span>➔</span>
              <span>CONTINUE</span>
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

