import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import curriculumService from '../../../services/curriculumService';
import GlyphBoard from './GlyphBoard';
import EngagementPopup from './EngagementPopup';
import boardTeacherImg from '../../../assets/images/board_teacher.png';
import LessonHeader from '../LessonHeader.jsx';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import Glyph from './glyphEngine';
import { getApiBase } from '../../../utils/apiBase.js';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import { unlockMobileAudio, prefetchTts, waitForTts, getTtsSrc, claimNarrationAudio } from '../../../utils/audioPreloadService.js';
import { getCharacterImage, useCharacterImages } from '../../../utils/characterImages.js';
import { markModuleAsCompleted } from '../../../utils/progressSyncService.js';

// Speaker pictures come from the shared, admin-editable character list
const getAvatarForSpeaker = (speaker = '') => getCharacterImage(speaker, 'arpit_sir');

// Check if an engagement item requires spoken audio recording (modal popup)
// versus tap/MCQ/rearrange which renders inline in the text series
const isAudioSpeak = (eng) => {
  if (!eng) return false;
  const t = String(eng.type || '').toLowerCase().trim();
  return t === 'engagement-audio' || t === 'audio' || t.includes('pronunciation') || t.includes('speak');
};

// Default Fallback Demo matching user's exact Digestion lesson from snippet
const DEFAULT_DEMO_CARDS = [
  {
    cardId: "card_1",
    cardTitle: "Teeth crush and chew, like a mixer",
    lines: [
      {
        id: "l1_1",
        lineIndex: 1,
        speaker: "Arpit Sir",
        text: "When you eat a chapati, digestion begins right inside your mouth!",
        glyphCode: "chapati"
      },
      {
        id: "l1_2",
        lineIndex: 2,
        speaker: "Arpit Sir",
        text: "Teeth crush and chew food into small pieces.",
        glyphCode: "chapati -> teeth -> tiny pieces"
      },
      {
        id: "l1_3",
        lineIndex: 3,
        speaker: "Arpit Sir",
        text: "A mixer-grinder does the same job. Its blade chops food into small bits.",
        glyphCode: "teeth_vs_mixer"
      },
      {
        id: "l1_eng",
        lineIndex: 4,
        isEngagement: true,
        type: "engagement-audio",
        speaker: "Arpit Sir",
        question: "Quick question",
        text: "Say this important word aloud",
        targetWord: "alimentary canal",
        pronunciation: "al-i-MEN-tuh-ree kuh-NAL",
        answer: "alimentary canal"
      }
    ]
  },
  {
    cardId: "card_2",
    cardTitle: "Smaller, but still chapati",
    lines: [
      {
        id: "l2_1",
        lineIndex: 1,
        speaker: "Arpit Sir",
        text: "Even when ground into tiny crumbs, chapati is still chapati!",
        glyphCode: "chapati -> tiny pieces"
      },
      {
        id: "l2_2",
        lineIndex: 2,
        speaker: "Arpit Sir",
        text: "Physically breaking food is mechanical digestion — it changes size, not chemical identity.",
        glyphCode: "teeth -> tiny pieces"
      },
      {
        id: "l2_eng",
        lineIndex: 3,
        isEngagement: true,
        type: "engagement-mcq",
        speaker: "Arpit Sir",
        question: "What type of digestion changes food size without changing its chemical identity?",
        options: [
          "Mechanical digestion",
          "Chemical digestion",
          "Thermal digestion"
        ],
        answer: "Mechanical digestion"
      }
    ]
  },
  {
    cardId: "card_3",
    cardTitle: "Smaller is not the same as simpler",
    lines: [
      {
        id: "l3_1",
        lineIndex: 1,
        speaker: "Arpit Sir",
        text: "Smaller is not the same as simpler! Teeth only break pieces physically.",
        glyphCode: "tiny pieces -> saliva"
      },
      {
        id: "l3_2",
        lineIndex: 2,
        speaker: "Arpit Sir",
        text: "Saliva and stomach fluids chemically break complex nutrients into simple building blocks.",
        glyphCode: "saliva -> stomach"
      },
      {
        id: "l3_eng",
        lineIndex: 3,
        isEngagement: true,
        type: "engagement-rearrange",
        speaker: "Arpit Sir",
        question: "Put the laddoo's journey in order.",
        options: [
          "Stomach",
          "Mouth",
          "Anus",
          "Large intestine",
          "Food pipe",
          "Small intestine"
        ],
        answer: "Mouth, Food pipe, Stomach, Small intestine, Large intestine, Anus"
      }
    ]
  }
];

// Parse board steps and cards from raw curriculum items
// v12 board items: header (C5.B1 / C1.WB1), steps (C5.B1.2), their lines (C5.B1.2.1) and inline
// board questions (C5.BQ1, C10.EQ3). Anything else (comic, JM, L1Q practice, MH, CC, FF) ends the board.
const isV12BoardPart = (it) => {
  const itemId = String(it?.itemId || '');
  const itemType = String(it?.type || '').toLowerCase();
  if (itemType === 'comic') return false;
  if (/\.W?B\d+(\.|$)/.test(itemId) || /\.(BQ|EQ)\d+$/.test(itemId)) return true;
  return ['blackboard', 'blackboard-step', 'board'].includes(itemType);
};

function parseBoardCards(rawItems, startIndex = 0) {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) return { cards: [], afterBoardIndex: -1, boardStartIndex: 0 };

  // Check if we have v12 style steps (items with inputJson.actions or type blackboard/board or itemId with .B)
  const hasV12Steps = rawItems.some(it => it.inputJson?.actions || (it.itemId && it.itemId.includes('.B')));

  if (hasV12Steps) {
    // With v12 item ids, play only the board section the lesson is at, so the story, practice and
    // concept items around it keep their place in the sheet's order. Without them, keep the whole lesson.
    const hasSectionIds = rawItems.some(it => /\.W?B\d+\.\d+\.\d+/.test(String(it.itemId || '')));
    let sectionStart = 0;
    let sectionEnd = rawItems.length;
    if (hasSectionIds) {
      sectionStart = Math.max(0, Math.min(Number(startIndex) || 0, rawItems.length - 1));
      while (sectionStart < rawItems.length && !isV12BoardPart(rawItems[sectionStart])) sectionStart++;
      while (sectionStart > 0 && isV12BoardPart(rawItems[sectionStart - 1])) sectionStart--;
      sectionEnd = sectionStart;
      while (sectionEnd < rawItems.length && isV12BoardPart(rawItems[sectionEnd])) sectionEnd++;
    }

    const cards = [];
    let currentBoardTitle = "Board Time";
    let currentStep = null;
    let insideBoard = false;
    let lastBoardItemIndex = -1;

    rawItems.forEach((it, idx) => {
      if (idx < sectionStart || idx >= sectionEnd) return;
      const itemType = String(it.type || '').toLowerCase().trim();
      const itemId = String(it.itemId || '');
      const hasActions = !!(it.inputJson?.actions && it.inputJson.actions.length > 0);
      const isBoardHeader = (itemType === 'blackboard' || itemType === 'board') && !hasActions && (itemId.match(/\.B\d+$/) || !it.inputJson);
      const isStep = hasActions || (itemType === 'blackboard' && itemId.match(/\.B\d+\.\d+$/)) || (it.inputJson?.title && hasActions);

      if (isBoardHeader) {
        insideBoard = true;
        currentBoardTitle = it.text || it.question || it.cardTitle || currentBoardTitle;
        lastBoardItemIndex = idx;
        return;
      }

      if (isStep) {
        insideBoard = true;
        lastBoardItemIndex = idx;
        if (currentStep) {
          cards.push(currentStep);
        }
        const stepTitle = it.text || it.question || it.inputJson?.title || `Step ${cards.length + 1}`;
        currentStep = {
          cardId: it._id ? String(it._id) : `step_${cards.length + 1}`,
          cardTitle: stepTitle,
          boardTitle: currentBoardTitle,
          itemId: it.itemId,
          rawIndex: idx,
          inputJson: it.inputJson,
          glyphCode: it.glyphCode || '',
          lines: [],
          engagement: null
        };
        return;
      }

      // If we are inside a step, collect lines or engagement in exact chronological sequence
      if (currentStep && insideBoard) {
        // Did we hit the next comic or non-board section?
        if (itemId.match(/\.P\d+/) || (itemType === 'comic')) {
          cards.push(currentStep);
          currentStep = null;
          insideBoard = false;
          return;
        }

        lastBoardItemIndex = idx;

        const isEngagementItem = itemType.startsWith('engagement') || 
                                 itemType === 'multiple-choice' || 
                                 itemType === 'mcq' || 
                                 itemType === 'fill-in-the-blank' || 
                                 itemType === 'fib' || 
                                 itemType === 'rearrange' || 
                                 itemId.includes('BQ') || 
                                 itemId.includes('.BQ') ||
                                 itemId.includes('EQ') ||
                                 itemId.includes('.EQ') ||
                                 (it.inputJson?.options && Array.isArray(it.inputJson.options));

        if (isEngagementItem) {
          const engType = (itemType.includes('rearrange') || itemType === 'rearrange')
            ? 'engagement-rearrange'
            : (itemType.includes('audio') || itemType.includes('say') || itemType.includes('speak'))
            ? 'engagement-audio'
            : 'engagement-mcq';

          let opts = it.options || it.inputJson?.options || [];
          if (typeof opts === 'string') {
            try {
              opts = JSON.parse(opts);
            } catch (_) {
              if (opts.includes('|')) {
                opts = opts.split('|').map(s => s.trim()).filter(Boolean);
              } else if (opts.includes('→')) {
                opts = opts.split('→').map(s => s.trim()).filter(Boolean);
              } else if (opts.includes('\n')) {
                opts = opts.split('\n').map(s => s.trim()).filter(Boolean);
              } else {
                opts = opts.split(',').map(s => s.trim()).filter(Boolean);
              }
            }
          }

          const engId = it._id ? String(it._id) : (it.itemId || `eng_${idx}`);
          const engObj = {
            id: engId,
            cardId: currentStep.cardId,
            type: engType,
            speaker: it.speaker || 'Arpit Sir',
            question: it.question || it.text || '',
            text: it.question || it.text || '',
            options: Array.isArray(opts) ? opts : [],
            answer: it.answer || '',
            explanation: it.explanation || it.inputJson?.explanation || '',
            targetWord: it.targetWord || it.answer || '',
            pronunciation: it.pronunciation || (Array.isArray(opts) ? opts[0] : ''),
            react: it.inputJson?.react || it.react || null,
            inputJson: it.inputJson,
            glyphCode: it.glyphCode || '',
            isEngagement: true
          };

          // Put engagement question directly into lines at its EXACT position in the step!
          currentStep.lines.push(engObj);
          return;
        }

        // Story or dialogue line
        if (itemType === 'story' || itemType === 'statement' || itemType === 'concept' || itemType === 'line' || itemType === 'dialogue') {
          currentStep.lines.push({
            id: it._id || `line_${idx}`,
            speaker: it.speaker || 'Arpit Sir',
            text: it.text || it.question || '',
            glyphCode: it.glyphCode || '',
            inputJson: it.inputJson,
            isEngagement: false
          });
        }
      }
    });

    if (currentStep) {
      cards.push(currentStep);
    }

    if (cards.length > 0) {
      // Ensure every step has at least one line (the step title or say item)
      cards.forEach((c, i) => {
        if (!c.lines || c.lines.length === 0) {
          const sayFirst = c.inputJson?.say?.[0]?.[1];
          c.lines = [{
            id: `${c.cardId}_def`,
            speaker: 'Arpit Sir',
            text: sayFirst || c.cardTitle || `Step ${i + 1}`,
            glyphCode: c.glyphCode || '',
            inputJson: c.inputJson,
            isEngagement: false
          }];
        }
        // If legacy c.engagement exists and is not yet in lines, append it
        if (c.engagement && !c.lines.some(l => l.isEngagement)) {
          c.lines.push({
            ...c.engagement,
            id: c.engagement.id || `${c.cardId}_eng`,
            cardId: c.cardId,
            isEngagement: true,
            text: c.engagement.question || c.engagement.text || ''
          });
        }
      });
      if (hasSectionIds) return { cards, afterBoardIndex: sectionEnd, boardStartIndex: sectionStart };
      return { cards, afterBoardIndex: lastBoardItemIndex >= 0 ? lastBoardItemIndex + 1 : -1, boardStartIndex: cards[0]?.rawIndex ?? 0 };
    }
  }

  // Fallback: legacy grouping (preserving inputJson!)
  const cardMap = new Map();
  let lastCardKey = null;

  rawItems.forEach((it, idx) => {
    const itemType = String(it.type || '').toLowerCase().trim();
    const isEngagement = itemType.startsWith('engagement') || 
                         itemType === 'multiple-choice' || 
                         itemType === 'mcq' || 
                         it.itemId?.includes('BQ');

    const cTitle = it.cardTitle || it.question || `Card ${cardMap.size + 1}`;
    const targetKey = it.cardTitle || lastCardKey || cTitle;
    lastCardKey = targetKey;

    if (!cardMap.has(targetKey)) {
      cardMap.set(targetKey, {
        cardId: `card_${cardMap.size + 1}`,
        cardTitle: targetKey,
        boardTitle: "Board Time",
        rawIndex: idx,
        inputJson: it.inputJson,
        lines: [],
        engagement: null
      });
    }
    const cardObj = cardMap.get(targetKey);

    if (isEngagement) {
      let opts = it.options || it.inputJson?.options || [];
      if (typeof opts === 'string') {
        try { opts = JSON.parse(opts); } catch (_) { opts = opts.split(',').map(s => s.trim()).filter(Boolean); }
      }
      cardObj.lines.push({
        id: it._id ? String(it._id) : (it.itemId || `eng_${idx}`),
        cardId: cardObj.cardId,
        type: itemType.includes('rearrange') ? 'engagement-rearrange' : (itemType.includes('audio') ? 'engagement-audio' : 'engagement-mcq'),
        speaker: it.speaker || 'Arpit Sir',
        question: it.question || it.text || '',
        text: it.question || it.text || '',
        options: Array.isArray(opts) ? opts : [],
        answer: it.answer || '',
        explanation: it.explanation || it.inputJson?.explanation || '',
        targetWord: it.targetWord || it.answer || '',
        pronunciation: it.pronunciation || '',
        react: it.inputJson?.react || it.react || null,
        inputJson: it.inputJson,
        glyphCode: it.glyphCode || '',
        isEngagement: true
      });
      return;
    }

    cardObj.lines.push({
      id: it._id || `line_${idx}`,
      lineIndex: it.lineIndex || cardObj.lines.length + 1,
      speaker: it.speaker || 'Arpit Sir',
      text: it.text || it.question || '',
      glyphCode: it.glyphCode || it.answer || '',
      inputJson: it.inputJson,
      isEngagement: false
    });
  });

  const legacyCards = Array.from(cardMap.values());
  return { cards: legacyCards, afterBoardIndex: -1, boardStartIndex: legacyCards[0]?.rawIndex ?? 0 };
}

export default function BlackboardMode() {
  useCharacterImages(); // redraw when admin-edited character pictures load
  const params = useParams();
  const moduleId = params.moduleId || params.moduleNumber;
  const boardEntryIndex = Number(params.index) || 0;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [nextSectionIndex, setNextSectionIndex] = useState(-1);
  const [boardStartIndex, setBoardStartIndex] = useState(0);
  const [rawItemsState, setRawItemsState] = useState([]);

  // Engagement Popup State
  const [activeEngagement, setActiveEngagement] = useState(null);
  const [completedEngagements, setCompletedEngagements] = useState(() => new Set());

  // Interactive Board Slider Widget State (Child drives blackboard animation)
  const [sliderT, setSliderT] = useState(null);
  const [sliderFeedback, setSliderFeedback] = useState({ status: 'idle', text: '' });
  const [completedSliders, setCompletedSliders] = useState(() => new Set());
  const sliderWaitingRef = useRef(false);

  // Audio state & auto-advance timer refs
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('blackboard_muted') === 'true';
    } catch (_) {
      return false;
    }
  });
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('blackboard_muted', String(next));
      } catch (_) {}
      isMutedRef.current = next;
      if (next) {
        stopAudio();
      } else {
        if (currentLine?.text && !activeEngagementRef.current) {
          playLineAudio(currentLine.text, currentLine.speaker);
        }
      }
      return next;
    });
  };

  const audioRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);
  const touchListenerRef = useRef(null);
  const isMountedRef = useRef(true);
  const currentLineIndexRef = useRef(currentLineIndex);
  const totalLinesInCardRef = useRef(1);
  const dialogueListRef = useRef(null);

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

  const cardsRef = useRef(cards);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const currentCardIndexRef = useRef(currentCardIndex);
  useEffect(() => { currentCardIndexRef.current = currentCardIndex; }, [currentCardIndex]);

  const completedEngagementsRef = useRef(completedEngagements);
  useEffect(() => { completedEngagementsRef.current = completedEngagements; }, [completedEngagements]);

  const activeEngagementRef = useRef(activeEngagement);
  useEffect(() => { activeEngagementRef.current = activeEngagement; }, [activeEngagement]);

  const tabRefs = useRef([]);

  // Auto-slide / scroll active card tab pill into view whenever currentCardIndex changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeTabEl = tabRefs.current[currentCardIndex];
      if (activeTabEl && typeof activeTabEl.scrollIntoView === 'function') {
        activeTabEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [currentCardIndex, cards.length]);

  useEffect(() => {
    if (dialogueListRef.current) {
      const container = dialogueListRef.current;
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }, [currentLineIndex]);

  // Load curriculum items or fallback to demo
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (moduleId && moduleId !== 'demo') {
          const resp = await curriculumService.listCurriculumItems(moduleId);
          const rawItems = resp?.data || [];
          setRawItemsState(rawItems);
          
          if (rawItems.length > 0) {
            const { cards: parsedCards, afterBoardIndex, boardStartIndex: startIdx } = parseBoardCards(rawItems, boardEntryIndex);
            setNextSectionIndex(afterBoardIndex);
            setBoardStartIndex(startIdx);

            if (parsedCards.length > 0) {
              setCurrentCardIndex(0);
              setCurrentLineIndex(0);
              setCards(parsedCards);
              setLoading(false);
              // Immediately prefetch first card lines and any engagement audio for instant playback!
              if (parsedCards[0]?.lines) {
                parsedCards[0].lines.forEach((l, idx) => {
                  const txt = l.targetWord || l.question || l.text;
                  if (txt) prefetchTts(getLineTtsUrl(txt, l.speaker), { priority: idx === 0 });
                });
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote blackboard items, using demo:", err);
      }
      
      // Fallback to demo
      setCards(DEFAULT_DEMO_CARDS);
      setLoading(false);
    }

    loadData();
  }, [moduleId, boardEntryIndex]);

  // Precompute initial pieces carry-over across consecutive cards
  const cardInits = useMemo(() => {
    const inits = [];
    let prev = null;
    (cards || []).forEach((c, i) => {
      inits[i] = prev;
      if (c?.inputJson?.actions) {
        try {
          if (Glyph && typeof Glyph.finalState === 'function') {
            prev = Glyph.finalState(c.inputJson, prev);
          }
        } catch (e) {
          console.warn('Error calculating finalState for card ' + i, e);
        }
      }
    });
    return inits;
  }, [cards]);

  const currentCard = cards[currentCardIndex] || cards[0] || DEFAULT_DEMO_CARDS[0];
  const lines = Array.isArray(currentCard?.lines) ? currentCard.lines : [];
  const totalLinesInCard = lines.length || 1;
  const currentLine = lines[currentLineIndex] || lines[0] || null;

  useEffect(() => {
    currentLineIndexRef.current = currentLineIndex;
  }, [currentLineIndex]);

  // Download the rest of this card, then the start of the next card, so lines change with no gap
  useEffect(() => {
    if (isMutedRef.current) return;
    lines.slice(currentLineIndex + 1).forEach((line, i) => preloadLineAudio(line, i === 0));
    const nextCardLines = cards[currentCardIndex + 1]?.lines;
    if (Array.isArray(nextCardLines)) nextCardLines.slice(0, 2).forEach(line => preloadLineAudio(line));
  }, [currentLineIndex, currentCardIndex, lines, cards]);


  useEffect(() => {
    totalLinesInCardRef.current = totalLinesInCard;
  }, [totalLinesInCard]);

  
  const getLineTtsUrl = (lineText, speakerName) => {
    const cleanText = String(lineText || '').replace(/["*]/g, '').trim();
    const speaker = speakerName || 'Arpit Sir';
    const apiBase = getApiBase();
    return `${apiBase}/api/ai/tts?text=${encodeURIComponent(cleanText)}&speaker=${encodeURIComponent(speaker)}&v=15`;
  };

  const preloadLineAudio = (lineItem, priority = false) => {
    if (!lineItem) return;
    const txt = lineItem.targetWord || lineItem.question || lineItem.text;
    if (!txt) return;
    prefetchTts(getLineTtsUrl(txt, lineItem.speaker), { priority });
  };

  const stopAudio = () => {
    setIsPaused(false);
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
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
        audioRef.current.onplay = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.src = '';
        audioRef.current = null;
      } catch (_) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    setIsPlaying(false);
  };

  const playLineAudio = (lineText, speakerName) => {
    if (!lineText || activeEngagementRef.current) return;

    stopAudio();

    const cleanText = String(lineText).replace(/["*]/g, '').trim();
    const speaker = speakerName || 'Arpit Sir';
    const apiBase = getApiBase();
    // 10% paced up audio for crisp, engaging blackboard instruction (+4% TTS rate, 1.0x HTML5 playback)
    const ttsUrl = getLineTtsUrl(cleanText, speaker);

    const onLineDone = () => {
      setIsPlaying(false);
      // Auto-advance to the next line in the current bunch with a relaxed, comfortable pause (1800ms)
      if (currentLineIndexRef.current < totalLinesInCardRef.current - 1) {
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
        autoAdvanceTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setCurrentLineIndex(prev => prev + 1);
            setAnimKey(k => k + 1);
          }
        }, 180);
      } else {
        // Reached end of card lines: auto-advance to next card or complete!
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
        // A slider step waits for the child: it moves on when they reach the target or tap Next
        if (sliderWaitingRef.current) return;
        autoAdvanceTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            if (currentCardIndexRef.current < cardsRef.current.length - 1) {
              setCurrentCardIndex(prev => prev + 1);
              setCurrentLineIndex(0);
              setAnimKey(k => k + 1);
            } else {
              handleProceedNext();
            }
          }
        }, 350);
      }
    };

    // If muted, do not play audio — set reading timer to advance line comfortably
    if (isMutedRef.current) {
      setIsPlaying(false);
      const readingDelay = Math.min(4500, Math.max(2200, cleanText.length * 50));
      autoAdvanceTimerRef.current = setTimeout(onLineDone, readingDelay);
      return;
    }

    const readingPaceFallback = () => {
      // Comfortably pace line progression if audio fails or cannot play on mobile
      const readingDelay = Math.min(5000, Math.max(2500, cleanText.length * 55));
      autoAdvanceTimerRef.current = setTimeout(onLineDone, readingDelay);
    };

    // The shared, tap-unlocked player (a new one per line is blocked by Safari)
    const audio = claimNarrationAudio();
    const turn = audio._hyTurn;
    audioRef.current = audio;

    audio.onplay = () => {
      if (isMountedRef.current && audioRef.current === audio && audio._hyTurn === turn) {
        setIsPlaying(true);
      }
    };
    audio.onended = onLineDone;
    audio.onerror = (e) => {
      console.warn("TTS network/playback error, falling back to reading timer:", e);
      readingPaceFallback();
    };

    // Stream immediately using getTtsSrc; background-prefetch caches it for replays
    const audioSrc = getTtsSrc(ttsUrl);
    prefetchTts(ttsUrl, { priority: true });
    audio.src = audioSrc;
    audio.play().then(() => {
      if (isMountedRef.current && audioRef.current === audio && audio._hyTurn === turn) {
        setIsPlaying(true);
      }
    }).catch(err => {
      console.warn("Autoplay audio error, unlocking audio & waiting for user gesture:", err);
      unlockMobileAudio();
      if (touchListenerRef.current) {
        window.removeEventListener('click', touchListenerRef.current);
        window.removeEventListener('touchstart', touchListenerRef.current);
      }
      const onFirstGesture = () => {
        window.removeEventListener('click', onFirstGesture);
        window.removeEventListener('touchstart', onFirstGesture);
        touchListenerRef.current = null;
        if (isMountedRef.current && audioRef.current === audio && audio._hyTurn === turn) {
          audio.play().catch(() => readingPaceFallback());
        }
      };
      touchListenerRef.current = onFirstGesture;
      window.addEventListener('click', onFirstGesture, { once: true, passive: true });
      window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
    });
  };

  // Audio Playback effect when line changes - handles speech audio or triggers popup for engagement items
  useEffect(() => {
    if (!currentLine) return;

    if (currentLine.isEngagement) {
      stopAudio();
      if (!completedEngagements.has(currentLine.id)) {
        setActiveEngagement(currentLine);
      }
      return;
    }

    if (currentLine.text && !activeEngagement) {
      playLineAudio(currentLine.text, currentLine.speaker);
    }
    return () => {
      stopAudio();
    };
  }, [currentCardIndex, currentLineIndex, currentLine?.id, activeEngagement]);

  // Replay: Rewinds to Line 1 and plays through blackboard sequence with drawings
  
  const togglePlayPause = () => {
    if (isPlaying) {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
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
          if (currentLine?.text) playLineAudio(currentLine.text, currentLine.speaker);
        });
      } else {
        setIsPaused(false);
        if (currentLine?.text) playLineAudio(currentLine.text, currentLine.speaker);
      }
    }
  };

  const toggleReplay = () => {
    stopAudio();
    setActiveEngagement(null);
    setCurrentLineIndex(0);
    setReplayKey(k => k + 1);
    setAnimKey(k => k + 1);

    const firstLine = currentCard?.lines?.[0];
    if (firstLine && !firstLine.isEngagement && firstLine.text) {
      playLineAudio(firstLine.text, firstLine.speaker);
    }
  };

  /**
   * Next:
   * Immediately advances to the next line or triggers engagement before next bunch!
   */
  const handleNext = () => {
    stopAudio();
    if (currentLine?.isEngagement && !completedEngagements.has(currentLine.id)) {
      setActiveEngagement(currentLine);
      return;
    }
    if (currentLineIndex < totalLinesInCard - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setAnimKey(k => k + 1);
    } else {
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setCurrentLineIndex(0);
        setAnimKey(k => k + 1);
      } else {
        handleProceedNext();
      }
    }
  };

  /**
   * Fast Forward:
   * Skips remaining lines in current bunch, triggers engagement if any, or jumps to NEXT BUNCH!
   */
  const handleFastForward = () => {
    stopAudio();
    if (currentLine?.isEngagement && !completedEngagements.has(currentLine.id)) {
      setActiveEngagement(currentLine);
      return;
    }
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setCurrentLineIndex(0);
      setAnimKey(k => k + 1);
    } else {
      handleProceedNext();
    }
  };

  // Called when student completes an inline engagement question (MCQ, rearrange, tap one)
  const handleInlineComplete = () => {
    const cardId = currentCard?.cardId;
    if (cardId) {
      setCompletedEngagements(prev => {
        const nextSet = new Set(prev);
        nextSet.add(cardId);
        return nextSet;
      });
    }

    // Auto-advance to next bunch after brief celebration
    setTimeout(() => {
      if (currentCardIndexRef.current < cardsRef.current.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setCurrentLineIndex(0);
        setAnimKey(k => k + 1);
      } else {
        handleProceedNext();
      }
    }, 750);
  };

  // Called when student skips an inline engagement question
  const handleInlineSkip = () => {
    const cardId = currentCard?.cardId;
    if (cardId) {
      setCompletedEngagements(prev => {
        const nextSet = new Set(prev);
        nextSet.add(cardId);
        return nextSet;
      });
    }

    if (currentCardIndexRef.current < cardsRef.current.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setCurrentLineIndex(0);
      setAnimKey(k => k + 1);
    } else {
      handleProceedNext();
    }
  };

  // ── Interactive Slider & Buttons Widget logic (Child drives blackboard animation) ──
  const currentWidget = currentCard?.inputJson?.widget;
  const isSliderWidget = Boolean(currentWidget && (currentWidget.type === 'slider' || currentWidget.type === 'board_slider'));
  const isButtonWidget = Boolean(currentWidget && (currentWidget.type === 'buttons' || currentWidget.type === 'button'));

  const [selectedWidgetButton, setSelectedWidgetButton] = useState(null);
  const [tappedWidgetButtons, setTappedWidgetButtons] = useState(() => new Set());

  // Reset or initialize widget state when current card changes
  useEffect(() => {
    if (isSliderWidget) {
      const initialT = typeof currentWidget.t0 === 'number' ? currentWidget.t0 : 0.1;
      setSliderT(initialT);
      if (completedSliders.has(currentCard.cardId)) {
        setSliderFeedback({ status: 'ok', text: currentWidget.ok || 'Target reached!' });
      } else {
        setSliderFeedback({ status: 'idle', text: '' });
      }
    } else if (isButtonWidget) {
      const initialT = typeof currentWidget.t0 === 'number' ? currentWidget.t0 : 0;
      setSliderT(initialT);
      setSelectedWidgetButton(null);
      setTappedWidgetButtons(new Set());
      if (completedSliders.has(currentCard.cardId)) {
        setSliderFeedback({ status: 'ok', text: 'All explored!' });
      } else {
        setSliderFeedback({ status: 'idle', text: '' });
      }
    } else {
      setSliderT(null);
      setSliderFeedback({ status: 'idle', text: '' });
    }
  }, [currentCardIndex, currentCard?.cardId, isSliderWidget, isButtonWidget]);

  // True while the current step is a slider/button widget the child has not completed yet (read by onLineDone)
  useEffect(() => {
    sliderWaitingRef.current = (isSliderWidget || isButtonWidget) && !completedSliders.has(currentCard?.cardId);
  }, [isSliderWidget, isButtonWidget, completedSliders, currentCard?.cardId]);

  const handleWidgetButtonClick = (opt, optIdx) => {
    setSelectedWidgetButton(optIdx);
    setTappedWidgetButtons(prev => {
      const next = new Set(prev).add(optIdx);
      const isComplete = currentWidget.all
        ? next.size >= (currentWidget.options?.length || 1)
        : (currentWidget.answer != null ? optIdx === currentWidget.answer : true);

      if (isComplete) {
        setCompletedSliders(c => new Set(c).add(currentCard?.cardId));
        sliderWaitingRef.current = false;
        setSliderFeedback({ status: 'ok', text: 'All explored!' });
      }
      return next;
    });

    if (typeof opt.t === 'number') {
      setSliderT(opt.t);
    }

    if (opt.say) {
      playLineAudio(opt.say, currentCard?.speaker || 'Arpit Sir');
    }
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSliderT(val);
  };

  const handleSliderRelease = () => {
    if (!currentWidget || !Array.isArray(currentWidget.target)) return;
    const [tMin, tMax] = currentWidget.target;
    const currentVal = typeof sliderT === 'number' ? sliderT : (currentWidget.t0 ?? 0);

    if (currentVal >= tMin && currentVal <= tMax) {
      setSliderFeedback({
        status: 'ok',
        text: currentWidget.ok || 'Target reached! Great job!'
      });
      setCompletedSliders(prev => new Set(prev).add(currentCard.cardId));
      sliderWaitingRef.current = false;
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([40, 60, 100]); } catch (e) {}
      }
      // Let the "Target reached!" message show, then move on (unless they already tapped Next)
      const cardIdx = currentCardIndex;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current || currentCardIndexRef.current !== cardIdx) return;
        if (cardIdx < cardsRef.current.length - 1) {
          setCurrentCardIndex(cardIdx + 1);
          setCurrentLineIndex(0);
          setAnimKey(k => k + 1);
        } else {
          handleProceedNext();
        }
      }, 1500);
    } else if (currentVal < tMin) {
      setSliderFeedback({
        status: 'early',
        text: currentWidget.early || 'Keep sliding, almost there!'
      });
    } else {
      setSliderFeedback({
        status: 'late',
        text: currentWidget.late || 'A bit too far! Slide back slightly.'
      });
    }
  };

  /**
   * Prev:
   * Immediately goes back one line or to previous bunch.
   */
  const handlePrev = () => {
    stopAudio();
    setActiveEngagement(null);
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
      setAnimKey(k => k + 1);
    } else if (currentCardIndex > 0) {
      const prevCardIdx = currentCardIndex - 1;
      const prevCardLines = cards[prevCardIdx]?.lines?.length || 1;
      setCurrentCardIndex(prevCardIdx);
      setCurrentLineIndex(prevCardLines - 1);
      setAnimKey(k => k + 1);
    }
  };

  const handleCardTabClick = (cardIdx) => {
    stopAudio();
    setActiveEngagement(null);
    setCurrentCardIndex(cardIdx);
    setCurrentLineIndex(0);
    setAnimKey(k => k + 1);
  };

  // Called when student completes or says the engagement question
  const handleEngagementComplete = () => {
    const activeId = activeEngagement?.id || currentLine?.id;
    if (activeId) {
      setCompletedEngagements(prev => new Set(prev).add(activeId));
    }
    if (currentCard?.cardId) {
      setCompletedEngagements(prev => new Set(prev).add(currentCard.cardId));
    }
    setActiveEngagement(null);

    // Auto-advance to the next line in this card, or next card if this was the last line!
    setTimeout(() => {
      if (!isMountedRef.current) return;
      if (currentLineIndexRef.current < totalLinesInCardRef.current - 1) {
        setCurrentLineIndex(prev => prev + 1);
        setAnimKey(k => k + 1);
      } else {
        if (currentCardIndexRef.current < cardsRef.current.length - 1) {
          setCurrentCardIndex(prev => prev + 1);
          setCurrentLineIndex(0);
          setAnimKey(k => k + 1);
        } else {
          handleProceedNext();
        }
      }
    }, 450);
  };

  const handleProceedNext = () => {
    stopAudio();
    const params = new URLSearchParams(searchParams);
    if (nextSectionIndex >= 0 && rawItemsState[nextSectionIndex]) {
      const nextIt = rawItemsState[nextSectionIndex];
      if (isMissionCompleteItem(nextIt)) {
        markModuleAsCompleted({
          moduleId,
          chapterId: searchParams.get('chapterId'),
          unitId: searchParams.get('unitId')
        });
        const completionParams = new URLSearchParams();
        completionParams.set('moduleId', String(moduleId));
        completionParams.set('chapter', String(moduleId));
        if (searchParams.get('chapterId')) completionParams.set('chapterId', searchParams.get('chapterId'));
        if (searchParams.get('unitId')) completionParams.set('unitId', searchParams.get('unitId'));
        navigate(`/lesson-complete?${completionParams.toString()}`);
        return;
      }
      const nextType = String(nextIt?.type || '').toLowerCase();
      if (['comic', 'story'].includes(nextType)) {
        const isNew = nextType === 'story' || isNewStyleStory({
          item: nextIt,
          items: rawItemsState,
          chapterId: searchParams.get('chapterId'),
          chapterTitle: searchParams.get('chapterTitle') || searchParams.get('title')
        });
        if (isNew) {
          navigate(`/learn/module/${moduleId}/story/${nextSectionIndex}?${params.toString()}`);
        } else {
          navigate(`/learn/module/${moduleId}/concept/${nextSectionIndex}?${params.toString()}`);
        }
        return;
      }
      if (['concept', 'statement'].includes(nextType)) {
        navigate(`/learn/module/${moduleId}/concept/${nextSectionIndex}?${params.toString()}`);
        return;
      }
      if (nextType === 'multiple-choice') {
        navigate(`/learn/module/${moduleId}/mcq/${nextSectionIndex}?${params.toString()}`);
        return;
      }
      if (nextType === 'fill-in-the-blank') {
        navigate(`/learn/module/${moduleId}/fillups/${nextSectionIndex}?${params.toString()}`);
        return;
      }
      if (nextType === 'rearrange') {
        navigate(`/learn/module/${moduleId}/rearrange/${nextSectionIndex}?${params.toString()}`);
        return;
      }
      if (nextType === 'descriptive') {
        navigate(`/learn/module/${moduleId}/descriptive/${nextSectionIndex}?${params.toString()}`);
        return;
      }
      if (['didyouknow', 'did_you_know', 'did-you-know', 'remember'].includes(nextType)) {
        navigate(`/learn/module/${moduleId}/didyouknow/${nextSectionIndex}?${params.toString()}`);
        return;
      }
      if (nextType.startsWith('engagement')) {
        navigate(`/learn/module/${moduleId}/engagement/${nextSectionIndex}?${params.toString()}`);
        return;
      }
    }
    if (moduleId && moduleId !== 'demo') {
      const startSearchIdx = Math.max(0, nextSectionIndex);
      const qIdx = rawItemsState.findIndex((it, i) => i >= startSearchIdx && ['multiple-choice', 'fill-in-the-blank', 'rearrange', 'descriptive'].includes(String(it.type || '').toLowerCase()));
      if (qIdx >= 0) {
        const qType = String(rawItemsState[qIdx]?.type || '').toLowerCase();
        if (qType === 'multiple-choice') return navigate(`/learn/module/${moduleId}/mcq/${qIdx}?${params.toString()}`);
        if (qType === 'fill-in-the-blank') return navigate(`/learn/module/${moduleId}/fillups/${qIdx}?${params.toString()}`);
        if (qType === 'rearrange') return navigate(`/learn/module/${moduleId}/rearrange/${qIdx}?${params.toString()}`);
        if (qType === 'descriptive') return navigate(`/learn/module/${moduleId}/descriptive/${qIdx}?${params.toString()}`);
      }
      markModuleAsCompleted({
        moduleId,
        chapterId: searchParams.get('chapterId'),
        unitId: searchParams.get('unitId')
      });
      navigate(`/lesson-complete?moduleId=${moduleId}&chapter=${moduleId}&${params.toString()}`);
    } else {
      navigate(`/learn/practice-demo?demo=true&title=${encodeURIComponent('Practice Demo')}`);
    }
  };

  
  const handleHeaderBack = () => {
    stopAudio();
    if (activeEngagement) {
      setActiveEngagement(null);
      return;
    }
    const chapterId = searchParams.get('chapterId');
    const unitId = searchParams.get('unitId');
    const exitParams = new URLSearchParams();
    if (chapterId) exitParams.set('chapterId', chapterId);
    if (unitId) exitParams.set('unitId', unitId);
    const exitQuery = exitParams.toString();
    navigate(`/learn${exitQuery ? '?' + exitQuery : ''}`);
  };

  const handleBack = () => {
    stopAudio();

    // 1. If engagement modal popup is open, close it
    if (activeEngagement) {
      setActiveEngagement(null);
      return;
    }

    // 2. Step back line-by-line within the current card
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
      setAnimKey(k => k + 1);
      return;
    }

    // 3. Step back to previous card if past the first card
    if (currentCardIndex > 0) {
      const prevCardIdx = currentCardIndex - 1;
      const prevCardLines = cards[prevCardIdx]?.lines?.length || 1;
      setCurrentCardIndex(prevCardIdx);
      setCurrentLineIndex(Math.max(0, prevCardLines - 1));
      setAnimKey(k => k + 1);
      return;
    }

    // 4. We are at Card 0, Line 0 (start of blackboard mode).
    // If there was a preceding item in this module (before board mode started), step back to it:
    const firstBoardRawIndex = boardStartIndex;
    if (firstBoardRawIndex > 0 && rawItemsState[firstBoardRawIndex - 1]) {
      const prevIdx = firstBoardRawIndex - 1;
      const prevIt = rawItemsState[prevIdx];
      const prevType = String(prevIt?.type || '').toLowerCase();
      const params = new URLSearchParams(searchParams);
      const query = params.toString() ? `?${params.toString()}` : '';

      if (['comic', 'story'].includes(prevType)) {
        const isNew = prevType === 'story' || isNewStyleStory({
          item: prevIt,
          items: rawItemsState,
          chapterId: searchParams.get('chapterId'),
          chapterTitle: searchParams.get('chapterTitle') || searchParams.get('title')
        });
        if (isNew) {
          navigate(`/learn/module/${moduleId}/story/${prevIdx}${query}`);
        } else {
          navigate(`/learn/module/${moduleId}/concept/${prevIdx}${query}`);
        }
        return;
      }
      if (['concept', 'statement'].includes(prevType)) {
        navigate(`/learn/module/${moduleId}/concept/${prevIdx}${query}`);
        return;
      }
      if (prevType === 'multiple-choice') {
        navigate(`/learn/module/${moduleId}/mcq/${prevIdx}${query}`);
        return;
      }
      if (prevType === 'fill-in-the-blank') {
        navigate(`/learn/module/${moduleId}/fillups/${prevIdx}${query}`);
        return;
      }
      if (prevType === 'rearrange') {
        navigate(`/learn/module/${moduleId}/rearrange/${prevIdx}${query}`);
        return;
      }
      if (prevType === 'descriptive') {
        navigate(`/learn/module/${moduleId}/descriptive/${prevIdx}${query}`);
        return;
      }
    }

    // 5. At the very beginning of the lesson: exit safely to /learn dashboard
    const chapterId = searchParams.get('chapterId');
    const unitId = searchParams.get('unitId');
    const exitParams = new URLSearchParams();
    if (chapterId) exitParams.set('chapterId', chapterId);
    if (unitId) exitParams.set('unitId', unitId);
    const exitQuery = exitParams.toString();
    navigate(`/learn${exitQuery ? '?' + exitQuery : ''}`);
  };

  const handleContinue = () => {
    handleNext();
  };

  // Stage Skip in Blackboard: jumps past the entire blackboard stage
  const handleStageSkip = () => {
    stopAudio();
    handleProceedNext();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0E1724] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1F6FE5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold tracking-wider text-slate-300">Loading Board Time...</p>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-[100dvh] bg-[#0E1724] text-white flex justify-center selection:bg-blue-600/30 overflow-hidden font-sans">
      <style>{`
        @keyframes cardSlideUp {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-6xl xl:max-w-7xl h-full flex flex-col bg-[#0E1724] relative overflow-hidden">
        
        {/* ── BACKGROUND BOARD TIME CONTENT (PAUSED & FROZEN WHEN ENGAGEMENT POPUP IS ACTIVE) ── */}
        <div 
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            activeEngagement 
              ? 'pointer-events-none select-none opacity-90' 
              : 'opacity-100'
          }`}
          aria-hidden={!!activeEngagement}
        >
          {/* ── TOP APP BAR (UNIFIED LESSON HEADER) ── */}
          <div className="flex-shrink-0 z-30">
            {(() => {
              const rawBoardIndex = cards[currentCardIndex]?.rawIndex ?? currentCardIndex;
              const boardStageInfo = getStageInfoForIndex(rawItemsState, rawBoardIndex);
              return (
                <LessonHeader
                  onBack={handleHeaderBack}
                  title="BOARD TIME"
                  currentIndex={rawBoardIndex}
                  total={rawItemsState.length || cards.length}
                  stageInfo={boardStageInfo}
                  theme="blackboard"
                  onSkip={handleStageSkip}
                  rightExtra={
                    <>
                    {/* Mute lives in the top bar so it never covers the board's drawing */}
                    <button
                      type="button"
                      onClick={toggleMute}
                      title={isMuted ? 'Unmute audio' : 'Mute audio'}
                      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                      aria-pressed={isMuted}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[2px] active:shadow-none shadow-[2px_3px_0px_0px_#060D17] ${
                        isMuted
                          ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/60 text-red-200'
                          : 'bg-[#122238] hover:bg-[#1a2f4c] border-slate-600 text-slate-100'
                      }`}
                    >
                      {isMuted ? (
                        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.314M6 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2l5-5v18l-5-5z" />
                        </svg>
                      )}
                    </button>
                    <ReportFlagButton
                      itemId={cards[currentCardIndex]?._id || cards[currentCardIndex]?.cardId || `board-card-${currentCardIndex}`}
                      moduleId={moduleId || ''}
                      chapterId={searchParams.get('chapterId') || ''}
                      questionText={`Blackboard: ${cards[currentCardIndex]?.title || 'Chalkboard Line'}`}
                      screenName={`Board Tab ${currentCardIndex + 1}`}
                      theme="blackboard"
                      className="w-8 h-8 sm:w-9 sm:h-9"
                    />
                    </>
                  }
                />
              );
            })()}
          </div>

        {/* ── BATCH / CARD TABS (HORIZONTAL PILLS - Single line only) ── */}
        <div className="px-2.5 sm:px-4 py-1 sm:py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2 sm:gap-3 flex-shrink-0 scroll-smooth">
          {(cards || []).map((card, idx) => {
            const isActive = idx === currentCardIndex;
            return (
              <button
                key={card?.cardId || idx}
                ref={(el) => (tabRefs.current[idx] = el)}
                onClick={() => handleCardTabClick(idx)}
                className={`flex-shrink-0 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl flex items-center gap-2 sm:gap-3 transition-all border sm:border-2 text-left active:scale-[0.98] whitespace-nowrap ${
                  isActive
                    ? 'bg-[#122238] border-[#1F6FE5] shadow-[0_0_14px_rgba(31,111,229,0.4)] ring-1 ring-[#1F6FE5]/50'
                    : 'bg-[#121E2B] border-[#1E2E40] opacity-80 hover:opacity-100 hover:border-[#2F455E]'
                }`}
              >
                {/* Number Badge */}
                <span className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black flex-shrink-0 transition-all ${
                  isActive 
                    ? 'bg-[#1F6FE5] text-white shadow-[0_0_10px_rgba(31,111,229,0.7)]' 
                    : 'bg-[#1F3144] text-slate-300'
                }`}>
                  {idx + 1}
                </span>

                {/* Card Title: Horizontal One Line Only */}
                <span 
                  style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
                  className={`text-xs sm:text-base md:text-lg font-black uppercase whitespace-nowrap tracking-wide ${
                    isActive ? 'text-white' : 'text-[#9BB4CE]'
                  }`}
                >
                  {card?.cardTitle || `Step ${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop: board on the left, dialogue on the right. Below lg this wrapper is display:contents,
            so phones and tablets keep the stacked board-then-lines layout unchanged. */}
        <div className="contents lg:flex lg:flex-row lg:flex-1 lg:min-h-0 lg:w-full lg:max-w-7xl lg:mx-auto lg:gap-6 lg:px-6 lg:pt-2">
        {/* ── STICKY BLACKBOARD CANVAS (Always visible at top while lines scroll underneath) ── */}
        <div className="w-full flex justify-center flex-shrink-0 px-2.5 sm:px-4 pt-0.5 pb-1 z-10 lg:w-auto lg:flex-[3] lg:min-w-0 lg:px-0 lg:pb-3 lg:items-stretch">
          <GlyphBoard
            currentLine={currentLine}
            cardLines={currentCard?.lines}
            stepJson={currentCard?.inputJson}
            initPieces={Array.isArray(cardInits) ? cardInits[currentCardIndex] : null}
            activeLineIndex={currentLineIndex}
            cardTitle={currentCard?.cardTitle || ''}
            cardIndex={currentCardIndex}
            replayKey={replayKey}
            animKey={`${currentCardIndex}_${replayKey}`}
            isPaused={!!activeEngagement}
            scrubTime={(isSliderWidget || isButtonWidget) ? sliderT : null}
            fillHeight
          />
        </div>

        {/* ── SCROLLABLE DIALOGUE STACK (Lines 1, 2, 3, 4 scroll beneath the sticky blackboard) ── */}
        <div 
          ref={dialogueListRef}
          className="flex-1 overflow-y-auto no-scrollbar px-2.5 sm:px-4 py-1.5 flex flex-col gap-2 sm:gap-3 lg:flex-[2] lg:min-w-0 lg:px-0 lg:py-1"
        >
          <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl flex flex-col gap-2 sm:gap-3 mx-auto pb-2">
            {lines.slice(0, currentLineIndex + 1).map((lineItem, lIdx) => {
              const isCurrentLine = lIdx === currentLineIndex;
              const spkLow = String(lineItem?.speaker || '').toLowerCase().trim();
              const isNarrator = spkLow.includes('narrat') || spkLow.includes('caption') || spkLow === 'scene narration';

              if (isNarrator) {
                return (
                  <div
                    key={lineItem.id || lineItem._id || lIdx}
                    onClick={() => {
                      setCurrentLineIndex(lIdx);
                      setAnimKey(k => k + 1);
                      if (lineItem.isEngagement) {
                        setActiveEngagement(lineItem);
                      }
                    }}
                    className={`w-full p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] cursor-pointer bg-[#FEF08A] select-none border-2 border-[#EAB308] shadow-[0_3px_0_0_#CA8A04] transition-all flex-shrink-0 ${
                      isCurrentLine
                        ? 'ring-2 ring-amber-400 -translate-y-0.5 shadow-[0_6px_20px_rgba(234,179,8,0.35)] opacity-100'
                        : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5'
                    }`}
                    style={{
                      fontFamily: "'Fredoka', 'Nunito', Trebuchet MS, sans-serif",
                      animation: isCurrentLine ? 'cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
                    }}
                  >
                    {isCurrentLine && isPlaying && !lineItem.isEngagement && (
                      <div className="flex items-center justify-end mb-1">
                        <span 
                          style={{ fontFamily: "'Nunito', sans-serif" }}
                          className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-300/80 px-2 py-0.5 rounded-full border border-amber-400/60 animate-pulse"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span>
                          <span>Speaking</span>
                        </span>
                      </div>
                    )}
                    <p 
                      style={{ 
                        fontFamily: "'Fredoka', 'Nunito', Trebuchet MS, sans-serif",
                        lineHeight: "1.38",
                        color: "#292524"
                      }}
                      className="text-[15px] sm:text-[18px] md:text-[19px] font-medium leading-[1.38] text-[#292524] select-text"
                    >
                      {lineItem?.text || lineItem?.question || ""}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={lineItem.id || lineItem._id || lIdx}
                  onClick={() => {
                    setCurrentLineIndex(lIdx);
                    setAnimKey(k => k + 1);
                    if (lineItem.isEngagement) {
                      setActiveEngagement(lineItem);
                    }
                  }}
                  className={`w-full bg-[#0A111A]/85 backdrop-blur-md rounded-[16px] sm:rounded-[22px] p-2 sm:p-2.5 flex items-start gap-2 sm:gap-3 flex-shrink-0 transition-all duration-300 cursor-pointer border ${
                    isCurrentLine
                      ? 'border-[#1F6FE5] shadow-[0_0_24px_rgba(31,111,229,0.32)] ring-1 ring-[#1F6FE5]/60 opacity-100 scale-[1.01]'
                      : 'border-white/10 opacity-75 hover:opacity-95 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
                  }`}
                  style={{
                    animation: isCurrentLine ? 'cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
                  }}
                >
                  {/* Avatar thumbnail: responsive 44px on mobile, 56px on desktop */}
                  <div className={`w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] sm:max-w-[44px] sm:max-h-[44px] rounded-full overflow-hidden bg-[#182332] flex-shrink-0 transition-all ${
                    isCurrentLine 
                      ? 'border-2 border-[#1F6FE5] shadow-[0_0_12px_rgba(31,111,229,0.5)]'
                      : 'border border-white/20'
                  }`}>
                    <img 
                      src={getAvatarForSpeaker(lineItem?.speaker)} 
                      alt={lineItem?.speaker || "Teacher"} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  {/* Line Info & Narration Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span 
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                        className={`block text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                          isCurrentLine ? 'text-[#1F6FE5]' : 'text-[#6B8BAA]'
                        }`}
                      >
                        LINE {lIdx + 1} OF {totalLinesInCard} {lineItem.isEngagement ? '• QUESTION' : ''}
                      </span>
                      {isCurrentLine && isPlaying && !lineItem.isEngagement && (
                        <span 
                          style={{ fontFamily: "'Nunito', sans-serif" }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#1F6FE5] bg-[#1F6FE5]/10 px-2 py-0.5 rounded-full border border-[#1F6FE5]/30 animate-pulse"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FE5]"></span>
                          <span>Speaking</span>
                        </span>
                      )}
                    </div>

                    {lineItem.isEngagement ? (
                      <div className="mt-1 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            ⚡ Quick Question
                          </span>
                          {completedEngagements.has(lineItem.id) ? (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              ✓ Completed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEngagement(lineItem);
                              }}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1F6FE5] hover:bg-[#185BC5] text-white active:scale-95 transition-all shadow-xs cursor-pointer"
                            >
                              Tap to answer ›
                            </button>
                          )}
                        </div>
                        <p 
                          style={{ 
                            fontFamily: "'Fredoka', Trebuchet MS, sans-serif",
                            lineHeight: "1.32"
                          }}
                          className={`text-[15px] sm:text-[17px] md:text-[19px] font-medium leading-[1.32] tracking-normal select-text ${
                            isCurrentLine ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {lineItem?.question || lineItem?.text || ""}
                        </p>
                      </div>
                    ) : (
                      <p 
                        style={{ 
                          fontFamily: "'Fredoka', Trebuchet MS, sans-serif",
                          lineHeight: "1.32"
                        }}
                        className={`text-[15px] sm:text-[17px] md:text-[19px] font-medium leading-[1.32] tracking-normal select-text ${
                          isCurrentLine ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {lineItem?.text || ""}
                      </p>
                    )}

                    {/* Interactive Slider Widget (Child drives the board animation) */}
                    {isCurrentLine && 
                     (lIdx === totalLinesInCard - 1 || lines.length === 1) && 
                     isSliderWidget && (
                      <div className="mt-4 w-full bg-[#0E1A29]/95 border border-[#1F6FE5]/40 rounded-[20px] p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col gap-3.5 select-none">
                        {/* Slider Title Header */}
                        <div className="flex items-center justify-between">
                          <span 
                            style={{ fontFamily: "'Nunito', sans-serif" }}
                            className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2"
                          >
                            <span>{currentWidget.label || '☀️ MOVE THE SLIDER'}</span>
                          </span>

                          {sliderFeedback.status === 'ok' ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide animate-pulse">
                              <span>✓</span>
                              <span>Target reached!</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Drag to play board
                            </span>
                          )}
                        </div>

                        {/* Slider Track with target range visualization */}
                        <div className="relative w-full flex items-center py-2.5">
                          {/* Background track */}
                          <div className="w-full h-3 rounded-full bg-slate-800 border border-white/10 relative overflow-hidden">
                            {/* Fill from start to current value */}
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-[width] duration-75"
                              style={{
                                width: `${Math.min(100, Math.max(0, (((sliderT ?? currentWidget.t0) - currentWidget.t0) / (currentWidget.t1 - currentWidget.t0)) * 100))}%`
                              }}
                            />

                            {/* Target Range Highlight */}
                            {Array.isArray(currentWidget.target) && (
                              <div 
                                className="absolute top-0 bottom-0 bg-emerald-400/50 border-x-2 border-emerald-300 pointer-events-none"
                                style={{
                                  left: `${Math.max(0, ((currentWidget.target[0] - currentWidget.t0) / (currentWidget.t1 - currentWidget.t0)) * 100)}%`,
                                  width: `${Math.max(4, ((currentWidget.target[1] - currentWidget.target[0]) / (currentWidget.t1 - currentWidget.t0)) * 100)}%`
                                }}
                                title="Target Zone"
                              />
                            )}
                          </div>

                          {/* Actual Range Input overlay with high touch target */}
                          <input 
                            type="range"
                            min={currentWidget.t0 ?? 0}
                            max={currentWidget.t1 ?? 10}
                            step={0.05}
                            value={typeof sliderT === 'number' ? sliderT : (currentWidget.t0 ?? 0)}
                            onChange={handleSliderChange}
                            onPointerUp={handleSliderRelease}
                            onTouchEnd={handleSliderRelease}
                            onKeyUp={handleSliderRelease}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                          />

                          {/* Custom styled glowing thumb indicator */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 border-2 border-white shadow-[0_0_16px_rgba(251,191,36,0.9)] pointer-events-none transition-transform z-10 -ml-3 sm:-ml-3.5"
                            style={{
                              left: `${Math.min(100, Math.max(0, (((sliderT ?? currentWidget.t0) - currentWidget.t0) / (currentWidget.t1 - currentWidget.t0)) * 100))}%`
                            }}
                          />
                        </div>

                        {/* Feedback response when student releases the slider */}
                        {sliderFeedback.text && (
                          <div 
                            style={{ fontFamily: "'Nunito', sans-serif" }}
                            className={`w-full p-3 rounded-[14px] text-xs sm:text-sm font-bold flex items-start gap-2.5 transition-all duration-300 ${
                              sliderFeedback.status === 'ok'
                                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                                : 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                            }`}
                          >
                            <span className="text-base flex-shrink-0">
                              {sliderFeedback.status === 'ok' ? '🎉' : '💡'}
                            </span>
                            <span className="leading-snug">{sliderFeedback.text}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Buttons Widget (Child taps each item to explore the board) */}
                    {isCurrentLine && 
                     (lIdx === totalLinesInCard - 1 || lines.length === 1) && 
                     isButtonWidget && (
                      <div className="mt-3.5 w-full bg-[#0E1A29]/95 border border-[#1F6FE5]/40 rounded-[20px] p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col gap-3 select-none">
                        <div className="flex items-center justify-between">
                          <span 
                            style={{ fontFamily: "'Nunito', sans-serif" }}
                            className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2"
                          >
                            <span>👉 {currentWidget.label || 'TAP TO TEST'}</span>
                          </span>
                          {completedSliders.has(currentCard?.cardId) && (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide">
                              <span>✓</span>
                              <span>All tested!</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                          {Array.isArray(currentWidget.options) && currentWidget.options.map((opt, optIdx) => {
                            const isSelected = selectedWidgetButton === optIdx;
                            const isTapped = tappedWidgetButtons.has(optIdx);
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWidgetButtonClick(opt, optIdx);
                                }}
                                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 border active:scale-95 ${
                                  isSelected
                                    ? 'bg-[#1F6FE5] text-white border-white/50 shadow-[0_0_18px_rgba(31,111,229,0.7)] scale-[1.02]'
                                    : isTapped
                                    ? 'bg-slate-800/90 text-emerald-300 border-emerald-500/40'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isTapped && <span className="text-xs text-emerald-400">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        {/* ── BOTTOM NAVIGATION CONTROLS (Prev, Replay, Next, Fast Forward) ── */}
        <div 
          style={{ fontFamily: "'Nunito', sans-serif" }}
          className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto px-2.5 sm:px-6 pt-1.5 pb-2.5 sm:pt-3 sm:pb-8 flex items-center justify-between gap-1.5 sm:gap-3 flex-shrink-0 z-20"
        >
          {/* Prev Button */}
          <button
            onClick={handlePrev}
            disabled={currentCardIndex === 0 && currentLineIndex === 0}
            style={{ fontFamily: "'Nunito', sans-serif" }}
            className={`flex-1 h-[42px] sm:h-[48px] rounded-[13px] sm:rounded-[16px] flex items-center justify-center gap-1 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 border ${
              currentCardIndex === 0 && currentLineIndex === 0
                ? 'bg-[#0A111A]/40 text-slate-600 border-white/5 cursor-not-allowed'
                : 'bg-[#0D1623] text-slate-200 hover:text-white hover:bg-[#121E30] border-white/10 hover:border-white/20'
            }`}
            title="Previous line"
          >
            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Prev</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            title={isPlaying ? "Pause dialogue" : "Resume dialogue"}
            style={{ fontFamily: "'Nunito', sans-serif" }}
            className={`flex-1 h-[42px] sm:h-[48px] rounded-[13px] sm:rounded-[16px] border flex items-center justify-center gap-1 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-[#0D1623] text-slate-200 hover:text-white hover:bg-[#121E30] border-white/10'
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1.5" />
                  <rect x="14" y="5" width="4" height="14" rx="1.5" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>

          {/* Next Button (Immediately changes line, in Hoshi Brand Blue) */}
          <button
            onClick={handleNext}
            style={{ fontFamily: "'Nunito', sans-serif" }}
            className="flex-1 h-[44px] sm:h-[52px] rounded-[14px] sm:rounded-[18px] bg-[#1F6FE5] hover:bg-[#185BC5] active:bg-[#1550B0] text-white font-black text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-[0_4px_20px_rgba(31,111,229,0.45)] border border-[#7CD3FF]/30 active:scale-95"
            title="Next line immediately"
          >
            <span>Next</span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Fast Forward Button (Skips directly to next bunch/card or finishes stage) */}
          <button
            onClick={handleFastForward}
            style={{ fontFamily: "'Nunito', sans-serif" }}
            className="flex-1 h-[44px] sm:h-[52px] rounded-[14px] sm:rounded-[18px] bg-[#0D1623] hover:bg-[#121E30] text-slate-200 hover:text-white border border-white/10 hover:border-white/20 flex items-center justify-center gap-1 font-black text-xs sm:text-base transition-all shadow-md active:scale-95 cursor-pointer"
            title="Fast forward"
          >
            <span className="truncate">
              <span className="hidden sm:inline">Fast </span>Forward
            </span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE ENGAGEMENT POPUP OVERLAY ── */}
      {activeEngagement && (
        <EngagementPopup 
          item={activeEngagement} 
          onComplete={handleEngagementComplete} 
        />
      )}
    </div>
    </div>
  );
}
