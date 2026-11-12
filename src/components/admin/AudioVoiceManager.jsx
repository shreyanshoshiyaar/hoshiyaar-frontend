import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../services/apiClient.js';
import { getApiBase } from '../../utils/apiBase.js';

// Same site-wide pace the backend adds on top of each character's rate (SITE_PACE_PERCENT in
// routes/aiRoutes.js), so a preview sounds like the lesson does.
const SITE_PACE_PERCENT = 22;
const withSitePace = (rate) => {
  const total = (parseInt(String(rate || '+0%'), 10) || 0) + SITE_PACE_PERCENT;
  return `${total >= 0 ? '+' : ''}${total}%`;
};

const CHARACTER_META = {
  arpit_sir: { label: 'Arpit Sir (Teacher)', icon: '👨‍🏫', desc: 'Main teacher & mentor voice' },
  hoshi: { label: 'Hoshi', icon: '👦', desc: 'Curious boy, main character' },
  chinki: { label: 'Chinki Didi', icon: '👧', desc: 'Smart older sister guide' },
  babloo: { label: 'Babloo', icon: '🧒', desc: 'Energetic cheerful kid' },
  ruhaan: { label: 'Ruhaan', icon: '👦', desc: 'Bright inquisitive student' },
  myra: { label: 'Myra', icon: '👧', desc: 'Sweet & encouraging student' },
  captain_anjali: { label: 'Captain Anjali', icon: '👩‍✈️', desc: 'Space explorer & mission leader' },
  dadi: { label: 'Dadi', icon: '👵', desc: 'Grandmother' },
  dr_kavita: { label: 'Dr. Kavita', icon: '👩‍⚕️', desc: 'Doctor & science mentor' },
  farmer_lakshmi: { label: 'Farmer Lakshmi', icon: '👩‍🌾', desc: 'Agricultural & nature guide' },
  narrator: { label: 'Narrator', icon: '📖', desc: 'Storyteller & scene narrator' },
  sharma: { label: 'Mr. Sharma', icon: '👨', desc: 'Elder teacher / parent voice' },
  default_male: { label: 'Default Male Narrator', icon: '🎙️', desc: 'Fallback for any male dialogue' },
  default_female: { label: 'Default Female Narrator', icon: '🎙️', desc: 'Fallback for any female dialogue' },
  default_fallback: { label: 'Universal Fallback', icon: '🌐', desc: 'Used when speaker is unknown' },
  male_01: { label: 'Male Speaker 1', icon: '👨', desc: 'Secondary male' },
  male_02: { label: 'Male Speaker 2', icon: '👨', desc: 'Secondary male' },
  female_01: { label: 'Female Speaker 1', icon: '👩', desc: 'Secondary female' },
  female_02: { label: 'Female Speaker 2', icon: '👩', desc: 'Secondary female' },
};

export default function AudioVoiceManager() {
  const [config, setConfig] = useState(null);
  const [speakers, setSpeakers] = useState([]); // every speaker in the lessons, from the backend
  const [availableVoices, setAvailableVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [playingSpeaker, setPlayingSpeaker] = useState(null);
  const [testText, setTestText] = useState('Namaste! Main Hoshiyaar app me bol raha hoon. Kya aap taiyaar hain?');
  
  const currentAudioRef = useRef(null);

  useEffect(() => {
    fetchConfig();
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/api/ai/tts-config');
      if (res.data?.success) {
        setConfig(res.data.config);
        setAvailableVoices(res.data.availableVoices || []);
        setSpeakers(res.data.speakers || []);
      }
    } catch (err) {
      console.error('Failed to load TTS config:', err);
      setErrorMsg('Failed to load audio configuration from backend.');
    } finally {
      setLoading(false);
    }
  };

  // A new speaker starts from the voice they use now, so changing one field keeps the rest
  const startingVoice = (key) => {
    const sp = speakers.find((x) => x.key === key);
    return (sp && config?.[sp.usesKey]) || { voice: 'en-IN-PrabhatNeural', pitch: '+0Hz', rate: '+0%' };
  };

  const handleVoiceChange = (speakerKey, field, val) => {
    setConfig(prev => ({
      ...prev,
      [speakerKey]: {
        ...(prev[speakerKey] || startingVoice(speakerKey)),
        [field]: val
      }
    }));
  };

  const handleGlobalSpeedChange = (val) => {
    setConfig(prev => ({
      ...prev,
      global_speed_offset: val
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg('');
      setSaveSuccess(false);

      const res = await api.post('/api/ai/tts-config', {
        config: config,
        voices: config,
        defaultSpeed: config.global_speed_offset
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save TTS config:', err);
      const denied = [401, 403].includes(err?.response?.status);
      setErrorMsg(denied ? 'Only admins can save voices. Log in with an admin account and try again.' : 'Failed to save changes to backend database.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAudio = async (speakerKey) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setPlayingSpeaker(speakerKey);

      // Plays the voice as set on this page (saved or not), at the pace students hear
      const spk = config?.[speakerKey] || startingVoice(speakerKey);
      const params = new URLSearchParams({
        text: testText || 'Hello',
        speaker: speakerKey,
        customVoice: spk.voice || 'en-IN-PrabhatNeural',
        pitch: spk.pitch || '+0Hz',
        rate: withSitePace(spk.rate),
      });
      const audio = new Audio(`${getApiBase()}/api/ai/tts?${params.toString()}`);
      currentAudioRef.current = audio;
      audio.onended = () => setPlayingSpeaker(null);
      audio.onerror = () => setPlayingSpeaker(null);
      await audio.play();
    } catch (err) {
      console.error('Failed to play test audio:', err);
      setPlayingSpeaker(null);
      alert('Could not generate voice preview. Please verify backend connection.');
    }
  };

  // Fixed characters, then one card for every speaker in the lessons who isn't one of them by
  // name (characters added by new chapters), so new chapters show up here on their own.
  const cards = useMemo(() => {
    const linesFor = (key) => speakers.filter((sp) => sp.named && sp.usesKey === key).reduce((n, sp) => n + sp.count, 0);
    const fixed = [
      'arpit_sir', 'chinki', 'hoshi', 'babloo', 'ruhaan', 'myra', 'dadi', 'narrator',
      'captain_anjali', 'dr_kavita', 'farmer_lakshmi',
      'default_male', 'default_female', 'default_fallback', 'sharma'
    ].map((key) => {
      const meta = CHARACTER_META[key] || { label: key, icon: '🗣️', desc: 'Character speaker' };
      return { key, ...meta, lines: speakers.length ? linesFor(key) : null, isNew: false };
    });
    const discovered = speakers.filter((sp) => !sp.named && sp.key).map((sp) => {
      const shownAs = CHARACTER_META[sp.usesKey]?.label || sp.usesKey;
      return {
        key: sp.key, label: sp.name, icon: '🆕', lines: sp.count, isNew: true,
        desc: config?.[sp.key]?.voice ? 'Has a voice of their own' : `New character · uses ${shownAs}'s voice for now`,
      };
    });
    return [...discovered, ...fixed];
  }, [speakers, config]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold">Loading Audio & Voice Studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎙️</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Audio & Voice Studio</h2>
          </div>
          <p className="mt-2 text-indigo-200 text-sm sm:text-base max-w-2xl font-medium">
            Manage Edge-TTS neural voices, speed, and pitch for every character and lesson narration across Hoshiyaar. New characters from uploaded chapters appear here on their own. Changes take effect instantly from the backend without redeploying frontend code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConfig}
            disabled={loading || saving}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-[0_4px_14px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            {saving ? '💾 Saving...' : '💾 Save All Voices'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 font-bold text-sm animate-fade-in shadow-xs">
          <span>✨</span>
          <span>Voice configuration saved to backend database successfully! Narrations and audio prompts are now updated live.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 flex items-center gap-3 text-rose-800 font-bold text-sm shadow-xs">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Global Speed & Test Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            Global Pace / Speed Boost
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {['+0%', '+5%', '+10%', '+15%', '+20%'].map(speed => (
              <button
                key={speed}
                type="button"
                onClick={() => handleGlobalSpeedChange(speed)}
                className={`px-4 py-2 rounded-xl font-black text-sm transition-all cursor-pointer ${
                  config?.global_speed_offset === speed
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {speed === '+0%' ? 'Normal (1.0x)' : `${speed} Pace Up`}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Requested: +10% pace up across all character speech and lesson voices.
          </p>
        </div>

        <div className="w-full lg:w-96">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            Test Phrase for Preview
          </label>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
            placeholder="Type sample phrase to preview..."
          />
        </div>
      </div>

      {/* Character Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(meta => {
          const key = meta.key;
          const spk = config?.[key] || startingVoice(key);
          const isPlaying = playingSpeaker === key;

          return (
            <div
              key={key}
              className={`bg-white rounded-2xl border-2 ${meta.isNew && !config?.[key] ? 'border-amber-300' : 'border-slate-200'} hover:border-indigo-300 transition-all p-5 shadow-sm flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-indigo-50 border border-indigo-100">{meta.icon}</span>
                    <div>
                      <h4 className="font-black text-slate-800 text-base leading-tight">{meta.label}</h4>
                      <p className="text-xs text-slate-400 font-medium">{meta.desc}</p>
                      {meta.lines !== null && (
                        <p className="text-[11px] text-slate-400 font-semibold">
                          {meta.lines ? `${meta.lines} line${meta.lines > 1 ? 's' : ''} in lessons` : 'Not in any lesson yet'}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestAudio(key)}
                    disabled={isPlaying}
                    title="Play voice preview"
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      isPlaying 
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <span>{isPlaying ? '🔊 Playing...' : '▶ Preview'}</span>
                  </button>
                </div>

                {/* Voice Selector */}
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Neural Voice (Edge TTS)
                    </label>
                    <select
                      value={spk.voice || 'en-IN-PrabhatNeural'}
                      onChange={(e) => handleVoiceChange(key, 'voice', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {availableVoices.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pitch & Rate Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Pitch
                      </label>
                      <select
                        value={spk.pitch || '+0Hz'}
                        onChange={(e) => handleVoiceChange(key, 'pitch', e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none"
                      >
                        {['-10Hz', '-5Hz', '+0Hz', '+3Hz', '+6Hz', '+12Hz', '+20Hz', '+26Hz', '+30Hz'].map(p => (
                          <option key={p} value={p}>{p === '+0Hz' ? 'Natural (0)' : p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Relative Rate
                      </label>
                      <select
                        value={spk.rate || '+0%'}
                        onChange={(e) => handleVoiceChange(key, 'rate', e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none"
                      >
                        {['-10%', '-5%', '+0%', '+2%', '+4%', '+6%', '+8%', '+10%'].map(r => (
                          <option key={r} value={r}>{r === '+0%' ? 'Natural (0)' : r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Key: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{key}</code></span>
                {meta.isNew && !config?.[key]
                  ? <span className="text-amber-600 font-bold">Not set yet</span>
                  : <span className="text-emerald-600 font-bold">Active in DB</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
