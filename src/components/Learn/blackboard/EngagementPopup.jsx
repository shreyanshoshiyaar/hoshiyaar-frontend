import React, { useState, useEffect, useRef } from 'react';
import boardTeacherImg from '../../../assets/images/board_teacher.png';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';
import { getReasonForOption } from './InlineEngagementCard';
import { playTtsAudio } from '../../../utils/audioPreloadService.js';
import { getCharacterImage, useCharacterImages } from '../../../utils/characterImages.js';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeech } from '@capacitor-community/speech-recognition';

// The Android WebView has no Web Speech API, so inside the app we use the phone's own recogniser.
// Installed builds from before the plugin was added report it unavailable and keep the web path.
const canUseNativeSpeech = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('SpeechRecognition');
  } catch (_) {
    return false;
  }
};

// Speaker pictures come from the shared, admin-editable character list
const getAvatarForSpeaker = (speaker = '') => getCharacterImage(speaker, 'arpit_sir');

export default function EngagementPopup({ item, onComplete }) {
  useCharacterImages(); // redraw when admin-edited character pictures load
  if (!item) return null;

  const type = String(item.type || 'engagement-audio').toLowerCase().trim();
  const rawOpts = item.options || item.opts || item.inputJson?.options;
  const hasOptions = (Array.isArray(rawOpts) && rawOpts.length > 0) || (typeof rawOpts === 'string' && rawOpts.trim().length > 0);

  const isRearrange = type === 'engagement-rearrange' || type.includes('rearrange');
  const isMcq = !isRearrange && (
    type === 'engagement-mcq' || 
    type === 'multiple-choice' || 
    type === 'mcq' || 
    type === 'fill-in-the-blank' || 
    type === 'fib' || 
    hasOptions
  );
  const isAudioType = !isMcq && !isRearrange;

  const speakerName = item.speaker || 'Arpit Sir';
  const speakerAvatar = getAvatarForSpeaker(speakerName);

  // Sound effects
  const playSound = (isCorrect) => {
    try {
      const audio = new Audio(isCorrect ? correctSfx : errorSfx);
      audio.volume = isCorrect ? 0.6 : 0.4;
      audio.play().catch(() => {});
    } catch (_) {}
  };

  // TTS audio playback for the speaker icon
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

    // Auto-read question text with TTS when engagement popup appears
  const playPromptAudio = () => {
    let textToSpeak = '';
    if (isAudioType) {
      // For audio speaking: speak target phrase or instruction
      textToSpeak = item.targetWord || (item.question || item.text || '').replace(/^Say with me:\s*/i, '').replace(/Say:\s*.*$/i, '').trim() || item.question || item.text || '';
    } else {
      // For MCQ / rearrange: speak the question!
      textToSpeak = item.question || item.text || item.targetWord || '';
    }
    if (!textToSpeak) return;

    setIsPlayingAudio(true);
    audioRef.current = playTtsAudio(textToSpeak, speakerName, () => setIsPlayingAudio(false));
  };

  useEffect(() => {
    const autoReadTimer = setTimeout(() => {
      playPromptAudio();
    }, 220);

    return () => {
      clearTimeout(autoReadTimer);
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [item?.id, item?._id]);

  // Success handling with celebration
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    playSound(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (onComplete) onComplete();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end items-center bg-black/25 animate-fade-in p-0 sm:p-4 select-none"
      onClick={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* ── BOTTOM SHEET CARD ── */}
      <div 
        className={`w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.3)] px-6 pt-5 pb-8 flex flex-col text-slate-800 transition-all duration-300 relative overflow-hidden ${
          isSuccess ? 'scale-[1.01] ring-4 ring-green-400' : ''
        }`}
        style={{
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <style>{`
          @keyframes slideUp {
            0% { transform: translateY(100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-1 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0 shadow-sm">
              <img 
                src={speakerAvatar} 
                alt={speakerName} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h3 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="font-black text-[#132238] text-lg sm:text-xl leading-tight tracking-tight"
              >
                {speakerName}
              </h3>
              <p className="text-sm font-semibold text-[#64748B]">
                Quick question
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Skip button for engagement questions */}
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              title="Skip this question"
            >
              <span>Skip</span>
              <span className="text-xs">›</span>
            </button>

            {/* Sound play button - clean dark navy speaker icon without enclosing circle */}
            <button
              type="button"
              onClick={playPromptAudio}
              aria-label="Listen"
              className="p-1.5 text-[#1E293B] hover:text-[#1E74FD] active:scale-90 transition-transform -mr-1 cursor-pointer focus:outline-hidden"
            >
              <svg 
                className={`w-7 h-7 sm:w-8 sm:h-8 fill-current ${isPlayingAudio ? 'text-[#1E74FD] animate-pulse' : 'text-[#1E293B]'}`} 
                viewBox="0 0 24 24"
              >
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── QUESTION BODY BY VARIETY ── */}
        {isMcq ? (
          <EngagementMcqContent item={item} onSuccess={handleSuccess} onSkip={handleSkip} playSound={playSound} />
        ) : isRearrange ? (
          <EngagementRearrangeContent item={item} onSuccess={handleSuccess} onSkip={handleSkip} playSound={playSound} />
        ) : (
          /* Default: engagement-audio (Pronunciation / "Say it") as shown in user screenshot */
          <EngagementAudioContent 
            item={item} 
            onSuccess={handleSuccess} 
            onSkip={handleSkip}
            playAudio={playPromptAudio}
            isPlayingAudio={isPlayingAudio} 
            playSound={playSound}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PHONETIC & FUZZY SPEECH MATCHER (ROBUST SPEECH RECOGNITION)
// ─────────────────────────────────────────────────────────────
function levenshteinDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] 
        ? dp[i - 1][j - 1] 
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarityRatio(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return (maxLen - levenshteinDist(a, b)) / maxLen;
}

function toPhoneticSkeleton(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/[·•\-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    // Science term syllable & acoustic normalizations:
    .replace(/\b(di\s*jes\s*chun|di\s*jes\s*shun|di\s*ges\s*shun|digest(ing|ed)?|di\s*ges\s*chun)\b/g, 'digestion')
    .replace(/\b(a\s*li\s*men\s*ta\s*ree|ali\s*mentary|almentry|elementry|alimentry)\b/g, 'alimentary')
    .replace(/\b(me\s*kan\s*i\s*kal|me\s*kan\s*i\s*cal|mechanic)\b/g, 'mechanical')
    .replace(/\b(ee\s*sof\s*a\s*gus|esofagus|esophagas|ee\s*sof\s*agus)\b/g, 'oesophagus')
    .replace(/\b(new\s*tra\s*lise|neutrali[sz](e|es|ed|ing)|new\s*tralise)\b/g, 'neutralise')
    .replace(/\b(pan\s*kree\s*at\s*ik|pancreas|pankreatic|pancreatic)\b/g, 'pancreatic')
    .replace(/\b(ab\s*sorp\s*shun|absorp\s*tion|absorb)\b/g, 'absorption')
    .replace(/\b(e+\s*jes\s*(chun|shun|tion)|ejestion|e+\s*ges\s*tion)\b/g, 'egestion')
    .replace(/\b(roo\s*mi\s*nay\s*shun|rumination)\b/g, 'rumination')
    .replace(/\b(giz\s*erd|gizzard)\b/g, 'gizzard')
    .replace(/\b(bree\s*thing|breath)\b/g, 'breathing')
    .replace(/\b(wind\s*pipe|windpipe)\b/g, 'windpipe')
    .replace(/\b(dye\s*a\s*fram|diaphragm|diagram|diaphragms|diagrams)\b/g, 'diaphragm')
    .replace(/\b(al\s*vee\s*o\s*lie|alveoli|alveolus)\b/g, 'alveoli')
    // en-IN recognisers often hear "gills" as "girls"
    .replace(/\b(gills?|girls)\b/g, 'gills')
    // Common acoustic transcriptions for Indian Hindi / English words:
    .replace(/\bladd?o+s?\b/g, 'laddoo')
    .replace(/\broti+s?\b/g, 'roti')
    .replace(/\bchap+at+i+s?\b/g, 'chapati')
    .replace(/\bdid+i+\b/g, 'didi')
    .replace(/\bbhai+y?a+\b/g, 'bhaiya')
    .replace(/\bsw?aa?d\b/g, 'swaad')
    .replace(/\bkha+na+\b/g, 'khana')
    .replace(/\bgol\s*gap+e?s?\b/g, 'golgappa')
    .replace(/\bbes+an\b/g, 'besan')
    .replace(/\bat+ta+\b/g, 'atta')
    .replace(/\bhal+wa+\b/g, 'halwa')
    .replace(/\bmith+ai+\b/g, 'mithai')
    .replace(/\bpaa?ni+\b/g, 'paani')
    .replace(/\bdal\b/g, 'dal')
    .replace(/\bchaw?al\b/g, 'chawal')
    // Common acoustic transcriptions for Indian & general English:
    .replace(/\belementary\b/g, 'alimentary')
    .replace(/\ballimentary\b/g, 'alimentary')
    .replace(/\balementary\b/g, 'alimentary')
    .replace(/\balmentry\b/g, 'alimentary')
    .replace(/\balimentry\b/g, 'alimentary')
    .replace(/\belimentary\b/g, 'alimentary')
    .replace(/\balimantry\b/g, 'alimentary')
    .replace(/\ball\s*mental(ly)?\b/g, 'alimentary')
    .replace(/\ba\s*limited\b/g, 'alimentary')
    .replace(/\bcan\s*all\b/g, 'canal')
    .replace(/\bcanel\b/g, 'canal')
    .replace(/\bkennel\b/g, 'canal')
    .replace(/\bcarnal\b/g, 'canal')
    .replace(/\bchannel\b/g, 'canal')
    .replace(/\bkunal\b/g, 'canal')
    .replace(/\boesophagus\b/g, 'esophagus')
    .replace(/\bteeths?\b/g, 'teeth')
    // Sound-alikes:
    .replace(/(tion|sion|chun)(s?)\b/g, 'shun$2')
    .replace(/gm\b/g, 'm') // silent g: diaphragm
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/w/g, 'v')
    .replace(/z/g, 's')
    .replace(/ee|ea|ey|ie/g, 'i')
    .replace(/oo|ou|u/g, 'u')
    .replace(/ai|ay|ei|ey/g, 'e')
    // collapse duplicates
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function getConsonants(str = '') {
  return toPhoneticSkeleton(str).replace(/[aeiou\s]/g, '');
}

const MATCH_STOPWORDS = new Set(['the', 'a', 'an', 'of', 'is', 'it', 'and', 'to', 'say']);
const isVowel = (ch) => 'aeiou'.includes(ch);

// How closely a heard chunk sounds like one target word (0..1): overall sound and consonant
// skeleton must both agree, and the opening sound must match (gills ≠ kills, gizzard ≠ lizard).
function wordSoundScore(heard, word) {
  if (!heard || !word) return 0;
  if (heard === word) return 1;
  const sameStart = heard[0] === word[0];
  const vowelStarts = isVowel(heard[0]) && isVowel(word[0]);
  if (!sameStart && !vowelStarts) return 0;
  const full = similarityRatio(heard, word);
  const consHeard = heard.replace(/[aeiou]/g, '');
  const consWord = word.replace(/[aeiou]/g, '');
  const cons = consHeard && consWord ? similarityRatio(consHeard, consWord) : full;
  const score = (full + cons) / 2;
  // A different opening vowel (isofagus / esofagus) is allowed only when the rest is very close
  return sameStart ? score : (score >= 0.85 ? score : 0);
}

// Best score for one target word against any 1–3 consecutive heard words joined together
// ("wind pipe" → windpipe, "die a frame" → diaphragm).
function bestWindowScore(heardWords, word) {
  let best = 0;
  for (let i = 0; i < heardWords.length; i++) {
    let joined = '';
    for (let len = 1; len <= 3 && i + len <= heardWords.length; len++) {
      joined += heardWords[i + len - 1];
      const heard = toPhoneticSkeleton(joined);
      best = Math.max(best, wordSoundScore(heard, word));
      // A plural said or heard ("surface areas", "gizzards") still counts
      if (heard.endsWith('s') && !word.endsWith('s')) best = Math.max(best, wordSoundScore(heard.slice(0, -1), word));
    }
  }
  return best;
}

// Every significant word of the phrase must be heard (alimentary canal needs both words).
function phraseHeard(heardWords, phrase) {
  const words = toPhoneticSkeleton(phrase).split(' ').filter(w => w && !MATCH_STOPWORDS.has(w));
  if (!words.length) return false;
  const joinedPhrase = words.join('');
  // The whole phrase said as one run of words ("windpipe" for "wind pipe" and the reverse)
  if (words.length > 1 && bestWindowScore(heardWords, joinedPhrase) >= 0.9) return true;
  return words.every(w => bestWindowScore(heardWords, w) >= 0.8);
}

function isPronunciationMatch(transcript, target, pronunciation) {
  if (!transcript || !target) return false;
  const heardWords = toPhoneticSkeleton(transcript).split(' ').filter(Boolean);
  if (!heardWords.length) return false;
  if (phraseHeard(heardWords, target)) return true;
  // The "Say: di · JES · chun" guide, read as one word. Only for one-word terms: for a phrase the
  // guide loses its word gaps, and a wrong word inside it would still score close.
  const isOneWordTerm = toPhoneticSkeleton(target).split(' ').filter(w => w && !MATCH_STOPWORDS.has(w)).length === 1;
  const guide = String(pronunciation || '').replace(/[·•\-]/g, ' ').replace(/\s+/g, '');
  return isOneWordTerm && Boolean(guide) && phraseHeard(heardWords, guide);
}

// ─────────────────────────────────────────────────────────────
// 1. ENGAGEMENT AUDIO ("Say it" / Pronunciation check)
// ─────────────────────────────────────────────────────────────
function EngagementAudioContent({ item, onSuccess, onSkip, playAudio, isPlayingAudio, playSound }) {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('idle'); // 'idle' | 'success' | 'wrong'
  const [recognizedText, setRecognizedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [micStatusMsg, setMicStatusMsg] = useState('');
  
  const recognitionRef = useRef(null);
  const listeningTimeoutRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const accumulatedRef = useRef('');
  const hasMatchedRef = useRef(false);
  // Bumped on every stop, so a native result that arrives after stop/unmount is ignored
  const nativeSessionRef = useRef(0);
  const nativeActiveRef = useRef(false);

  // Target word to say:
  const targetWord = item.targetWord || item.answer || item.question || '';
  
  // Lead-in sentence text:
  const leadText = item.text && item.text !== targetWord ? item.text : `It is called the ${targetWord}.`;
  
  // Pronunciation guide:
  const pronunciation = item.pronunciation || 
    (item.question || item.text || '').match(/Say:\s*([^.\n]+)/i)?.[1]?.replace(/[·•]/g, '').trim() || 
    (Array.isArray(item.options) && item.options[0]) || '';

  const stopRecognition = () => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    nativeSessionRef.current++;
    if (nativeActiveRef.current) {
      nativeActiveRef.current = false;
      NativeSpeech.stop().catch(() => {});
    }
    setIsListening(false);
  };

  // Android app: the phone's recogniser listens until the child stops speaking, then returns
  // up to 5 guesses, which are checked with the same matcher as the web path.
  const startNativeListening = async () => {
    const session = nativeSessionRef.current;
    const isStale = () => session !== nativeSessionRef.current;
    try {
      const { available } = await NativeSpeech.available();
      if (isStale()) return;
      if (!available) {
        setMicStatusMsg('Speech recognition is not available on this phone. Say the word, then tap "I said it".');
        return;
      }
      let perm = await NativeSpeech.checkPermissions();
      if (perm.speechRecognition !== 'granted') perm = await NativeSpeech.requestPermissions();
      if (isStale()) return;
      if (perm.speechRecognition !== 'granted') {
        setMicStatusMsg('Microphone blocked. Please allow the microphone for HoshiYaar in phone settings, or tap "I said it".');
        return;
      }

      nativeActiveRef.current = true;
      setIsListening(true);
      setMicStatusMsg('Listening... Speak now!');
      const { matches = [] } = await NativeSpeech.start({ language: 'en-IN', maxResults: 5, partialResults: false, popup: false });
      nativeActiveRef.current = false;
      if (isStale()) return;
      setIsListening(false);

      const heard = matches.map(m => String(m || '').trim()).filter(Boolean);
      if (heard.some(text => isPronunciationMatch(text, targetWord, pronunciation))) {
        hasMatchedRef.current = true;
        setFeedback('success');
        if (playSound) playSound(true);
      } else if (heard.length) {
        setRecognizedText(heard[0]);
        setFeedback('wrong');
        if (playSound) playSound(false);
      } else {
        setMicStatusMsg('No voice detected. Tap the mic to try again, or tap "I said it".');
      }
    } catch (err) {
      nativeActiveRef.current = false;
      if (isStale()) return;
      setIsListening(false);
      const msg = String(err?.message || err || '');
      console.warn('[NativeSpeech] error:', msg);
      if (/permission/i.test(msg)) {
        setMicStatusMsg('Microphone blocked. Please allow the microphone for HoshiYaar in phone settings, or tap "I said it".');
      } else if (/network|server/i.test(msg)) {
        setMicStatusMsg('Speech check needs internet. Check the connection and tap the mic, or tap "I said it".');
      } else {
        // "No match", "No speech input", busy recogniser
        setMicStatusMsg('Didn\'t catch that. Tap the mic and say the word clearly, or tap "I said it".');
      }
    }
  };

  useEffect(() => {
    const autoMicTimer = setTimeout(() => {
      startListening();
    }, 400);

    return () => {
      clearTimeout(autoMicTimer);
      stopRecognition();
    };
  }, []);

  // Initialize Speech Recognition
  const startListening = async () => {
    if (typeof window === 'undefined') return;

    stopRecognition();
    hasMatchedRef.current = false;
    accumulatedRef.current = '';
    setInterimText('');
    setRecognizedText('');
    setFeedback('idle');
    setMicStatusMsg('Listening... Say the word!');

    if (canUseNativeSpeech()) {
      startNativeListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback for browsers without speech API: mark success cleanly
      setFeedback('success');
      if (playSound) playSound(true);
      return;
    }

    // Request mic permission safely and release hardware stream immediately
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn('Microphone permission check:', err);
    }

    try {
      const recognition = new SpeechRecognition();
      
      // en-IN recognizes English words with Indian accents with high precision
      const navLang = navigator.language || '';
      recognition.lang = (navLang.startsWith('en') || !navLang) ? 'en-IN' : navLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;

      // Prime SpeechGrammarList if supported
      const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
      if (SpeechGrammarList) {
        try {
          const grammarList = new SpeechGrammarList();
          const cleanTarget = targetWord.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
          grammarList.addFromString(`#JSGF V1.0; grammar terms; public <term> = ${cleanTarget} ;`, 1);
          recognition.grammars = grammarList;
        } catch (_) {}
      }

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback('idle');
        setMicStatusMsg('Listening... Speak now!');

        // Generous safety auto-stop after 9 seconds
        listeningTimeoutRef.current = setTimeout(() => {
          stopRecognition();
          // Check final accumulation
          const finalUtterance = accumulatedRef.current.trim();
          if (!hasMatchedRef.current) {
            if (finalUtterance && isPronunciationMatch(finalUtterance, targetWord, pronunciation)) {
              hasMatchedRef.current = true;
              setFeedback('success');
              if (playSound) playSound(true);
            } else if (finalUtterance) {
              setFeedback('wrong');
              if (playSound) playSound(false);
              setRecognizedText(finalUtterance);
            } else {
              setMicStatusMsg('No voice detected. Tap the mic to try again, or tap "I said it".');
            }
          }
        }, 9000);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // If match already occurred, exit
        if (hasMatchedRef.current) return;

        // Final check on accumulated text
        const finalText = accumulatedRef.current.trim();
        if (finalText) {
          if (isPronunciationMatch(finalText, targetWord, pronunciation)) {
            hasMatchedRef.current = true;
            setFeedback('success');
            if (playSound) playSound(true);
          } else {
            setFeedback('wrong');
            if (playSound) playSound(false);
            setRecognizedText(finalText);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechRecognition] error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          setMicStatusMsg('Microphone blocked. Please allow mic in browser settings, or tap "I said it".');
          setFeedback('idle');
        } else if (event.error === 'no-speech') {
          setMicStatusMsg('Didn\'t catch that. Say the word clearly, or tap "I said it".');
        } else if (event.error === 'aborted') {
          // Normal abort on match or toggle
        } else {
          setIsListening(false);
        }
      };

      recognition.onresult = (event) => {
        let fullAccumulated = '';
        let latestChunk = '';
        const candidates = [];

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const top = (res[0]?.transcript || '').trim();
          if (top) {
            fullAccumulated += (fullAccumulated ? ' ' : '') + top;
            latestChunk = top;
          }
          for (let a = 0; a < res.length; a++) {
            const alt = (res[a]?.transcript || '').trim();
            if (alt) candidates.push(alt);
          }
        }

        fullAccumulated = fullAccumulated.trim();
        accumulatedRef.current = fullAccumulated;
        const currentSpoken = fullAccumulated || latestChunk;
        
        if (currentSpoken) {
          setRecognizedText(currentSpoken);
          setInterimText(currentSpoken);
          candidates.push(currentSpoken);
        }

        // Instant match check on all heard variants
        const matched = candidates.some(text => isPronunciationMatch(text, targetWord, pronunciation));

        if (matched) {
          hasMatchedRef.current = true;
          stopRecognition();
          setFeedback('success');
          if (playSound) playSound(true);
          return;
        }

        // Debounce silence: if user spoke something, give them 2.2s after they stop speaking to auto-finalize
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (fullAccumulated.length > 2) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecognition();
            if (!hasMatchedRef.current) {
              const finalSpoken = accumulatedRef.current.trim();
              if (finalSpoken && isPronunciationMatch(finalSpoken, targetWord, pronunciation)) {
                hasMatchedRef.current = true;
                setFeedback('success');
                if (playSound) playSound(true);
              } else if (finalSpoken) {
                setFeedback('wrong');
                if (playSound) playSound(false);
                setRecognizedText(finalSpoken);
              }
            }
          }, 2200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start SpeechRecognition:', err);
      setIsListening(false);
      setFeedback('success');
      if (playSound) playSound(true);
    }
  };

  const handleManualSaidIt = () => {
    stopRecognition();
    hasMatchedRef.current = true;
    setFeedback('success');
    if (playSound) playSound(true);
  };

  const handleSkip = () => {
    stopRecognition();
    if (onSkip) {
      onSkip();
    } else if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Lead-in sentence text */}
      {leadText && (
        <p className="text-base sm:text-lg text-slate-700 font-medium my-2">
          {leadText}
        </p>
      )}

      {/* Target Word in Big Bold Vibrant Blue font */}
      <h2 
        style={{ fontFamily: "var(--f-display, 'Fredoka', 'Bangers', sans-serif)" }}
        className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1F6FE5] tracking-tight my-2 select-text"
      >
        {targetWord}
      </h2>

      {/* Pronunciation guide */}
      {pronunciation ? (
        <div className="mt-1 mb-5">
          <p className="text-sm sm:text-base font-bold text-slate-700">
            Say it like this: <span className="font-extrabold text-slate-900">{pronunciation}</span>
          </p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            (that is how it sounds, not how it is spelled)
          </p>
        </div>
      ) : (
        <div className="mb-4" />
      )}

      {/* Big Circular Microphone Button - Click while listening stops and evaluates */}
      <button
        onClick={isListening ? stopRecognition : startListening}
        aria-label={isListening ? "Tap to stop" : "Tap to speak"}
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-[0_8px_24px_rgba(31,111,229,0.35)] cursor-pointer ${
          isListening 
            ? 'bg-red-500 animate-pulse ring-8 ring-red-300' 
            : feedback === 'success'
            ? 'bg-emerald-600 ring-4 ring-emerald-200'
            : feedback === 'wrong'
            ? 'bg-red-500 ring-4 ring-red-200 animate-shake'
            : 'bg-[#1F6FE5] hover:bg-[#185BC5] ring-4 ring-blue-100 hover:ring-blue-200'
        }`}
      >
        <svg className="w-9 h-9 sm:w-11 sm:h-11 fill-current" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>

      {/* Real-time speech status / live hearing caption */}
      {isListening && (
        <div className="mt-3 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs sm:text-sm font-bold text-[#1F6FE5] flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#1F6FE5] animate-ping" />
          <span>{interimText ? `Hearing: "${interimText}"` : 'Listening... Say the word!'}</span>
        </div>
      )}

      {!isListening && micStatusMsg && feedback === 'idle' && (
        <p className="mt-2 text-xs font-semibold text-amber-600 px-4">
          {micStatusMsg}
        </p>
      )}

      {/* ── STATE 1: SUCCESS (Super! Banner + Green Continue Button) ── */}
      {feedback === 'success' && (
        <div className="w-full mt-4 flex flex-col items-center animate-fade-in">
          <div className="w-full bg-[#E8F8EE] rounded-2xl p-4 flex items-start gap-3 border border-emerald-200 mb-3 text-left">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 mt-0.5 shadow-xs">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="font-black text-emerald-900 text-xl leading-tight mb-1"
              >
                Super!
              </h4>
              <p className="text-xs sm:text-sm font-bold text-emerald-800">
                &ldquo;{pronunciation || targetWord}&rdquo; &mdash; great saying!
              </p>
            </div>
          </div>

          <button
            onClick={onSuccess}
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="w-full h-14 bg-[#16A34A] hover:bg-[#15803D] active:translate-y-[2px] text-white font-black text-xl rounded-2xl border-b-4 border-[#166534] shadow-[0_6px_20px_rgba(22,163,74,0.35)] transition-all flex items-center justify-center active:scale-[0.99]"
          >
            Continue
          </button>
        </div>
      )}

      {/* ── STATE 2: WRONG (Not quite! Banner + Try again / I said it / Skip) ── */}
      {feedback === 'wrong' && (
        <div className="w-full mt-4 flex flex-col items-center animate-fade-in">
          <div className="w-full bg-[#FEE2E2] rounded-2xl p-4 flex items-start gap-3 border border-red-200 mb-3 text-left animate-shake">
            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 mt-0.5 shadow-xs">
              ✕
            </div>
            <div className="flex-1 min-w-0">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="font-black text-red-900 text-xl leading-tight mb-1"
              >
                Not quite!
              </h4>
              <p className="text-xs sm:text-sm font-bold text-red-800">
                {recognizedText ? `Heard: "${recognizedText}". ` : ''}Let&rsquo;s try saying it one more time!
              </p>
            </div>
          </div>

          <div className="w-full flex gap-2.5">
            <button
              onClick={() => { setFeedback('idle'); startListening(); }}
              style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
              className="flex-1 h-14 bg-[#EF4444] hover:bg-[#DC2626] active:translate-y-[2px] text-white font-black text-lg rounded-2xl border-b-4 border-[#B91C1C] shadow-md transition-all flex items-center justify-center active:scale-[0.99] cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={handleManualSaidIt}
              style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
              className="flex-1 h-14 bg-[#FACC15] hover:bg-[#EAB308] active:translate-y-[2px] text-slate-950 font-black text-lg rounded-2xl border-b-4 border-[#CA8A04] shadow-md transition-all flex items-center justify-center active:scale-[0.99] cursor-pointer"
            >
              I said it
            </button>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 py-1.5 px-4 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black text-xs sm:text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <span>Skip this question</span>
            <span className="text-xs">›</span>
          </button>
        </div>
      )}

      {/* ── STATE 3: IDLE (Initial view before speaking) ── */}
      {feedback === 'idle' && (
        <div className="w-full flex flex-col items-center">
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-4 mb-2.5">
            No microphone here? Say it out loud, then tap &ldquo;I said it&rdquo;.
          </p>

          <button
            onClick={handleManualSaidIt}
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="w-full h-14 bg-[#FACC15] hover:bg-[#EAB308] active:translate-y-[2px] text-slate-950 font-black text-xl rounded-2xl border-b-4 border-[#CA8A04] shadow-md transition-all flex items-center justify-center active:scale-[0.99] cursor-pointer"
          >
            I said it
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 py-1.5 px-4 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black text-xs sm:text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <span>Skip this question</span>
            <span className="text-xs">›</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. ENGAGEMENT MCQ
// ─────────────────────────────────────────────────────────────
function EngagementMcqContent({ item, onSuccess, onSkip, playSound }) {
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [feedback, setFeedback] = useState('idle'); // 'idle' | 'success' | 'wrong'

  const question = item.question || item.text || 'Pick the correct answer:';
  const rawOpts = item.options || item.opts || item.inputJson?.options;
  let options = [];
  if (Array.isArray(rawOpts) && rawOpts.length > 0) {
    options = rawOpts;
  } else if (typeof rawOpts === 'string' && rawOpts.trim()) {
    try {
      options = JSON.parse(rawOpts);
    } catch (_) {
      if (rawOpts.includes('|')) {
        options = rawOpts.split('|').map(s => s.trim()).filter(Boolean);
      } else if (rawOpts.includes('→')) {
        options = rawOpts.split('→').map(s => s.trim()).filter(Boolean);
      } else if (rawOpts.includes('\n')) {
        options = rawOpts.split('\n').map(s => s.trim()).filter(Boolean);
      } else {
        options = rawOpts.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }
  if (!Array.isArray(options) || options.length === 0) {
    options = item.answer ? [item.answer, 'Option A', 'Option B'] : ['Option A', 'Option B', 'Option C'];
  }

  const rawAns = item.answer != null ? String(item.answer).trim() : '';
  const hasSpecificAnswer = rawAns.length > 0;
  const correctAnswer = hasSpecificAnswer ? rawAns.toLowerCase() : null;

    const handleSelect = (opt) => {
    setSelectedOpt(opt);
    const cleanOpt = String(opt || '').trim().toLowerCase();

    // If no specific answer is defined in sheet (curiosity question), all options are accepted!
    const isCorrect = !hasSpecificAnswer || 
                      cleanOpt === correctAnswer || 
                      (correctAnswer && (cleanOpt.includes(correctAnswer) || correctAnswer.includes(cleanOpt)));

    if (isCorrect) {
      setFeedback('success');
      if (playSound) playSound(true);
      // Fast auto-advance after 500ms without requiring a manual Continue button
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    } else {
      setFeedback('wrong');
      if (playSound) playSound(false);
    }
  };

  return (
    <div className="flex flex-col text-left">
      <h2 
        style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
        className="text-lg sm:text-xl font-black text-slate-900 mb-3 tracking-tight leading-snug"
      >
        {question}
      </h2>

      <div className="flex flex-col gap-2.5 mb-3">
        {options.map((opt, i) => {
          const isSelected = selectedOpt === opt;
          const isCurrentWrong = isSelected && feedback === 'wrong';
          const isCurrentCorrect = isSelected && feedback === 'success';

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={feedback === 'success'}
              className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left font-bold text-base sm:text-lg flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                isCurrentCorrect
                  ? 'bg-green-50 border-green-500 text-green-900 shadow-md ring-2 ring-green-300'
                  : isCurrentWrong
                  ? 'bg-red-50 border-red-500 text-red-900 animate-shake shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-extrabold text-slate-700 shadow-xs">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </div>
              {isCurrentCorrect && (
                <span className="text-green-600 font-extrabold text-xl">✓</span>
              )}
              {isCurrentWrong && (
                <span className="text-red-600 font-extrabold text-xl">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback State 1: Fast celebration banner (auto-advances without manual continue button) */}
      {feedback === 'success' && (
        <div className="w-full flex flex-col items-center animate-fade-in">
          <div className="w-full bg-[#E8F8EE] rounded-2xl p-3.5 flex items-start gap-3 border border-emerald-200 text-left">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 mt-0.5 shadow-xs">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="font-black text-emerald-900 text-lg leading-tight mb-0.5"
              >
                Super!
              </h4>
              <p className="text-xs sm:text-sm font-bold text-emerald-800">
                {getReasonForOption(item, selectedOpt) || (hasSpecificAnswer ? `“${selectedOpt}” — correct!` : `“${selectedOpt}” — thoughtful answer!`)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback State 2: Not quite! banner */}
      {feedback === 'wrong' && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full bg-[#FEE2E2] rounded-2xl p-3.5 flex items-start gap-3 border border-red-200 text-left animate-shake">
            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 mt-0.5 shadow-xs">
              ✕
            </div>
            <div className="flex-1 min-w-0">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="font-black text-red-900 text-base leading-tight mb-0.5"
              >
                Not quite!
              </h4>
              <p className="text-xs sm:text-sm font-bold text-red-800">
                {getReasonForOption(item, selectedOpt) || "Pick another option and try again."}
              </p>
            </div>
          </div>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="mt-3 py-1.5 px-4 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black text-xs sm:text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <span>Skip this question</span>
              <span className="text-xs">›</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. ENGAGEMENT REARRANGE
// ─────────────────────────────────────────────────────────────
function EngagementRearrangeContent({ item, onSuccess, playSound }) {
  const rawWords = item.words || item.options;
  const words = Array.isArray(rawWords) && rawWords.length > 0 
    ? rawWords 
    : (typeof rawWords === 'string' && rawWords.trim()
        ? (rawWords.includes('|') ? rawWords.split('|') : rawWords.includes('→') ? rawWords.split('→') : rawWords.includes('\n') ? rawWords.split('\n') : rawWords.split(',')).map(s => s.trim()).filter(Boolean)
        : (item.answer ? String(item.answer).replace(/→|->/g, ',').split(',').map(s => s.trim()).filter(Boolean) : []));

  const [availableWords, setAvailableWords] = useState(() => 
    words.map((w, idx) => ({ id: `${w}_${idx}`, text: w.trim() })).sort(() => Math.random() - 0.5)
  );
  const [selectedWords, setSelectedWords] = useState([]);
  const [isTypeMode, setIsTypeMode] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [feedback, setFeedback] = useState('idle'); // 'idle' | 'success' | 'wrong'

  // Question metadata
  const badgeText = item.badge || 'Warm up';
  const stepText = item.step || '1 / 2';

  // Sentence parsing for blank fill-in vs sequence ordering
  const rawSentence = item.text || item.question || 'Food is broken down in a long tube called the ________ canal.';
  const hasBlankInSentence = rawSentence.includes('____') || rawSentence.includes('[blank]');
  
  // Clean question title without duplicate lines
  const questionTitle = item.label || item.questionTitle || (hasBlankInSentence ? 'Fill in the missing word:' : (item.question || 'Put in the correct order:'));
  const correctAnswer = item.answer || item.targetWord || words.join('');

  // Assembled display text
  const assembledWord = isTypeMode 
    ? typedText 
    : selectedWords.map(w => w.text).join(words.some(w => w.length > 5) ? ' ' : '');

  const handleSelectWord = (wordObj) => {
    setAvailableWords(prev => prev.filter(w => w.id !== wordObj.id));
    setSelectedWords(prev => [...prev, wordObj]);
    setFeedback('idle');
  };

  const handleRemoveWord = (wordObj) => {
    setSelectedWords(prev => prev.filter(w => w.id !== wordObj.id));
    setAvailableWords(prev => [...prev, wordObj]);
    setFeedback('idle');
  };

  const handleRemoveLast = () => {
    if (selectedWords.length === 0) return;
    const lastWord = selectedWords[selectedWords.length - 1];
    handleRemoveWord(lastWord);
  };

  const handleMoveWord = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= selectedWords.length) return;
    setSelectedWords(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    setFeedback('idle');
  };

  const handleClearAll = () => {
    if (selectedWords.length === 0) return;
    setAvailableWords(prev => [...prev, ...selectedWords]);
    setSelectedWords([]);
    setFeedback('idle');
  };

  // Drag and drop for desktop reordering
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const sourceIdx = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(sourceIdx) || sourceIdx === targetIdx) return;
    setSelectedWords(prev => {
      const next = [...prev];
      const [removed] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
    setFeedback('idle');
  };

  const normalizeStr = (str) => {
    return String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const handleCheck = () => {
    const rawTarget = Array.isArray(item.answer) 
      ? item.answer.join(', ') 
      : String(item.answer || item.targetWord || words.join(', '));
    const targetTokens = rawTarget
      .split(/[,>\-\n]/)
      .map(s => normalizeStr(s))
      .filter(Boolean);

    let isCorrect = false;

    if (isTypeMode) {
      const userStr = normalizeStr(typedText);
      const targetStr = normalizeStr(rawTarget);
      isCorrect = userStr === targetStr || userStr === targetTokens.join('');
    } else {
      const userTokens = selectedWords.map(w => normalizeStr(w.text));
      
      if (targetTokens.length > 0 && userTokens.length === targetTokens.length) {
        // Strict in-order check for each position
        isCorrect = userTokens.every((token, idx) => token === targetTokens[idx]);
      } else {
        // Collapsed string match
        const userCollapsed = userTokens.join('');
        const targetCollapsed = targetTokens.join('') || normalizeStr(correctAnswer);
        isCorrect = userCollapsed === targetCollapsed;
      }
    }

    if (isCorrect) {
      setFeedback('success');
      if (playSound) playSound(true);
    } else {
      setFeedback('wrong');
      if (playSound) playSound(false);
    }
  };

  // Render sentence with the interactive blank line
  const renderSentenceWithBlank = () => {
    if (!hasBlankInSentence) {
      return null;
    }

    const parts = rawSentence.split(/_{3,}|\[blank\]/);

    return (
      <div 
        style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
        className="text-lg sm:text-xl md:text-2xl font-black text-[#101F33] my-2 leading-relaxed tracking-tight"
      >
        <span>{parts[0]}</span>
        <button
          type="button"
          onClick={handleRemoveLast}
          title={assembledWord ? "Tap to clear last piece" : ""}
          className={`inline-flex items-center justify-center min-w-[90px] sm:min-w-[120px] px-2.5 py-0.5 mx-1.5 border-b-4 border-[#1E74FD] text-center align-middle transition-all ${
            assembledWord 
              ? 'text-[#1E74FD] font-black cursor-pointer bg-blue-50/50 rounded-t-lg' 
              : 'text-transparent select-none'
          }`}
        >
          {assembledWord || '________'}
        </button>
        <span>{parts[1] || ''}</span>
      </div>
    );
  };

  const hasInput = isTypeMode ? typedText.trim().length > 0 : selectedWords.length > 0;

  return (
    <div className="flex flex-col text-left">
      {/* ── TOP BADGE & COUNTER BAR (MATCHING media_1792570683591.png) ── */}
      <div className="flex items-center justify-between mb-3">
        {/* Mint green pill */}
        <div className="px-3.5 py-1 rounded-full bg-[#E6F9F0] text-[#027A48] font-black text-xs sm:text-sm tracking-wide shadow-xs">
          {badgeText}
        </div>

        {/* Counter (1 / 2) */}
        <div className="text-slate-500 font-extrabold text-sm sm:text-base">
          {stepText}
        </div>
      </div>

      {/* ── QUESTION HEADER ── */}
      <div className="mb-2">
        <h3 
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="text-lg sm:text-xl font-black text-[#101F33] tracking-tight leading-snug"
        >
          {questionTitle}
        </h3>
      </div>

      {/* ── SENTENCE WITH INTERACTIVE BLANK (FOR FILL-IN VARIETY) ── */}
      {renderSentenceWithBlank()}

      {/* ── ANSWER FIELD (DROP ZONE WHERE TAPPED PIECES GO) ── */}
      {!hasBlankInSentence && !isTypeMode && (
        <div className="w-full my-2">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-xs font-bold text-[#64748B] tracking-wide uppercase">
              Your Answer Field ({selectedWords.length}/{words.length})
            </span>
            {selectedWords.length > 0 && feedback !== 'success' && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-black text-[#1E74FD] hover:text-[#0B57D0] cursor-pointer active:scale-95 transition-transform"
              >
                Clear all
              </button>
            )}
          </div>

          <div 
            className={`w-full min-h-[76px] sm:min-h-[86px] p-3 rounded-[22px] border-2 transition-all flex flex-wrap items-center gap-2 sm:gap-2.5 ${
              feedback === 'wrong'
                ? 'border-red-400 bg-red-50/50 shadow-inner ring-2 ring-red-200 animate-shake'
                : feedback === 'success'
                ? 'border-emerald-400 bg-emerald-50/50 shadow-inner ring-2 ring-emerald-200'
                : selectedWords.length > 0
                ? 'border-[#1E74FD]/40 bg-[#F4F8FF]'
                : 'border-dashed border-[#CBDCEE] bg-[#F8FAFC]'
            }`}
          >
            {selectedWords.length === 0 ? (
              <div className="w-full flex items-center justify-center py-3 text-slate-400 font-bold text-sm sm:text-base select-none">
                <span>Tap the boxes below in order</span>
              </div>
            ) : (
              selectedWords.map((wordObj, idx) => (
                <div
                  key={wordObj.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="group relative inline-flex items-center rounded-[16px] bg-white border-2 border-[#1E74FD] shadow-xs hover:shadow-md transition-all select-none"
                >
                  {/* Left nudge button (only if not first) */}
                  {idx > 0 && feedback !== 'success' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleMoveWord(idx, -1); }}
                      title="Move left"
                      className="px-1.5 py-2 text-slate-400 hover:text-[#1E74FD] hover:bg-blue-50 rounded-l-[14px] text-xs font-black transition-colors"
                    >
                      ‹
                    </button>
                  )}

                  {/* Word content with tap to remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(wordObj)}
                    title="Tap to remove and return below"
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="font-black text-[#101F33] text-base sm:text-lg">
                      {wordObj.text}
                    </span>
                    <span className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-red-500 text-slate-400 group-hover:text-white flex items-center justify-center text-[10px] font-black transition-colors">
                      ✕
                    </span>
                  </button>

                  {/* Right nudge button (only if not last) */}
                  {idx < selectedWords.length - 1 && feedback !== 'success' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleMoveWord(idx, 1); }}
                      title="Move right"
                      className="px-1.5 py-2 text-slate-400 hover:text-[#1E74FD] hover:bg-blue-50 rounded-r-[14px] text-xs font-black transition-colors"
                    >
                      ›
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── INTERACTION AREA: TILE CHIPS OR TYPE IT MODE ── */}
      {feedback !== 'success' && (
        <div className="w-full my-2 flex flex-col items-center">
          {isTypeMode ? (
            /* TYPE IT INPUT */
            <div className="w-full max-w-sm flex flex-col items-center gap-2 mb-3 animate-fade-in">
              <input
                type="text"
                autoFocus
                value={typedText}
                onChange={(e) => {
                  setTypedText(e.target.value);
                  setFeedback('idle');
                }}
                placeholder={hasBlankInSentence ? "Type the missing word..." : "Type in order (e.g. Mouth, Food pipe...)"}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#1E74FD] text-lg sm:text-xl font-black text-center text-[#101F33] bg-[#F8FAFC] focus:outline-hidden focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
              />
            </div>
          ) : (
            /* AVAILABLE PIECE CHIPS (MATCHING media_1792570683591.png) */
            <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-3 min-h-[50px]">
              {availableWords.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSelectWord(w)}
                  className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-[16px] bg-white border-2 border-[#CBDCEE] hover:border-[#1E74FD] hover:bg-[#F0F7FF] text-[#101F33] font-black text-lg sm:text-xl shadow-xs active:scale-95 transition-all cursor-pointer select-none"
                >
                  {w.text}
                </button>
              ))}
            </div>
          )}

          {/* ⌨ TYPE IT TOGGLE BUTTON (MATCHING media_1792570683591.png) */}
          <button
            type="button"
            onClick={() => {
              setIsTypeMode(prev => !prev);
              setFeedback('idle');
            }}
            className="px-5 py-2.5 rounded-[16px] border-2 border-[#CBDCEE] bg-white hover:bg-slate-50 text-[#101F33] font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 shadow-xs transition-all mx-auto cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current text-slate-700" viewBox="0 0 24 24">
              <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
            </svg>
            <span>{isTypeMode ? "🧩 Tap pieces" : "Type it"}</span>
          </button>
        </div>
      )}

      {/* ── STATE 1: SUCCESS (Super! Banner + Green Continue Button) ── */}
      {feedback === 'success' && (
        <div className="w-full flex flex-col items-center animate-fade-in mt-2">
          <div className="w-full bg-[#E8F8EE] rounded-2xl p-4 flex items-start gap-3 border border-emerald-200 mb-4 text-left">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 mt-0.5 shadow-xs">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="font-black text-emerald-900 text-xl leading-tight mb-1"
              >
                Super!
              </h4>
              <p className="text-xs sm:text-sm font-bold text-emerald-800">
                &ldquo;{selectedWords.length > 0 ? selectedWords.map(w => w.text).join(' → ') : assembledWord}&rdquo; &mdash; that is correct!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSuccess}
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="w-full h-14 sm:h-16 bg-[#16A34A] hover:bg-[#15803D] active:translate-y-[2px] text-white font-black text-xl rounded-[22px] border-b-4 border-[#166534] shadow-[0_6px_20px_rgba(22,163,74,0.35)] transition-all flex items-center justify-center active:scale-[0.99] cursor-pointer"
          >
            Continue
          </button>
        </div>
      )}

      {/* ── STATE 2: WRONG (Not quite! Banner) ── */}
      {feedback === 'wrong' && (
        <div className="w-full mb-3 bg-[#FEE2E2] rounded-2xl p-3.5 flex items-start gap-3 border border-red-200 text-left animate-shake mt-2">
          <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 mt-0.5 shadow-xs">
            ✕
          </div>
          <div className="flex-1 min-w-0">
            <h4 
              style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
              className="font-black text-red-900 text-base leading-tight mb-0.5"
            >
              Not quite!
            </h4>
            <p className="text-xs sm:text-sm font-bold text-red-800">
              {isTypeMode 
                ? "Check your spelling and try again!" 
                : hasBlankInSentence
                ? "Tap the blank to adjust pieces and try again!"
                : "Tap any piece above or use the arrows to rearrange and try again!"}
            </p>
          </div>
        </div>
      )}

      {/* ── BOTTOM CHECK BUTTON (MATCHING media_1792570683591.png) ── */}
      {feedback !== 'success' && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!hasInput}
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className={`w-full h-14 sm:h-16 rounded-[22px] font-black text-xl flex items-center justify-center transition-all select-none mt-2 ${
            !hasInput
              ? 'bg-[#DCE5EF] text-[#8295AA] cursor-not-allowed'
              : 'bg-[#FACC15] hover:bg-[#EAB308] border-b-4 border-[#CA8A04] text-slate-950 shadow-md active:translate-y-[2px] active:scale-[0.99] cursor-pointer'
          }`}
        >
          Check
        </button>
      )}
    </div>
  );
}
