import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';
import paymentService from '../../services/paymentService';

const SystemSettingsManager = () => {
  const [missionVideoUrl, setMissionVideoUrl] = useState('');
  const [missionVideoDesktopUrl, setMissionVideoDesktopUrl] = useState('');
  const [onboardingVideoUrl, setOnboardingVideoUrl] = useState('');
  const [homepageSlides, setHomepageSlides] = useState(['', '', '', '', '', '']);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [examModeLive, setExamModeLive] = useState(false);
  const [challengesLive, setChallengesLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [trialConfig, setTrialConfig] = useState({
    trialHours: 48,
    passPrice: 99,
    passOriginalPrice: 599,
    guestLessonLimit: 5,
    trialLessonLimit: 7,
    passDays: 180,
  });
  const [trialSaving, setTrialSaving] = useState(false);
  const [trialMsg, setTrialMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      try {
        const payData = await paymentService.getAdminSettings();
        const pass = payData?.plans?.find((p) => p.code === 'pass_6m');
        setTrialConfig({
          trialHours: payData?.config?.trialHours ?? 48,
          passPrice: payData?.config?.passPrice ?? pass?.amount ?? 99,
          passOriginalPrice: payData?.config?.passOriginalPrice ?? pass?.discountedFrom ?? 599,
          guestLessonLimit: payData?.config?.guestLessonLimit ?? 5,
          trialLessonLimit: payData?.config?.trialLessonLimit ?? 7,
          passDays: payData?.config?.passDays ?? pass?.durationDays ?? 180,
          ...payData?.config,
        });
      } catch (e) {
        console.warn('Could not fetch payment config in SystemSettings', e);
      }
      const resVideo = await curriculumService.getSetting('mission_video_url');
      if (resVideo.data) {
        setMissionVideoUrl(resVideo.data.value || '');
      }
      const resDesktopVideo = await curriculumService.getSetting('mission_video_desktop_url');
      if (resDesktopVideo.data) {
        setMissionVideoDesktopUrl(resDesktopVideo.data.value || '');
      }
      const resOnboarding = await curriculumService.getSetting('onboarding_video_url');
      if (resOnboarding.data) {
        setOnboardingVideoUrl(resOnboarding.data.value || '');
      }
      const resSlides = await curriculumService.getSetting('homepage_slides');
      if (resSlides.data && Array.isArray(resSlides.data.value)) {
        let slides = [...resSlides.data.value];
        while (slides.length < 6) slides.push('');
        setHomepageSlides(slides);
      }
      const resMaintenance = await curriculumService.getSetting('maintenance_mode');
      if (resMaintenance.data) {
        setMaintenanceMode(resMaintenance.data.value === true || resMaintenance.data.value === 'true');
      }
      const resExam = await curriculumService.getSetting('exam_mode_live');
      if (resExam.data) {
        setExamModeLive(resExam.data.value === true || resExam.data.value === 'true');
      }
      const resChallenges = await curriculumService.getSetting('challenges_live');
      if (resChallenges.data) {
        setChallengesLive(resChallenges.data.value === true || resChallenges.data.value === 'true');
      }
    } catch (err) {
      console.error('Failed to fetch setting', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeYoutubeUrl = (url) => {
    if (!url) return '';
    let normalized = url.trim();
    
    // Handle shorts: https://youtube.com/shorts/VIDEO_ID
    if (normalized.includes('/shorts/')) {
      const videoId = normalized.split('/shorts/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle watch: https://www.youtube.com/watch?v=VIDEO_ID
    if (normalized.includes('watch?v=')) {
      const videoId = normalized.split('watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle youtu.be: https://youtu.be/VIDEO_ID
    if (normalized.includes('youtu.be/')) {
      const videoId = normalized.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return normalized;
  };

  const handleSaveVideo = async () => {
    if (!missionVideoUrl) return;
    const normalizedUrl = normalizeYoutubeUrl(missionVideoUrl);
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'mission_video_url',
        value: normalizedUrl,
        description: "URL for the 'Today's Mission' video on the homescreen"
      });
      setMissionVideoUrl(normalizedUrl);
      setMessage({ text: 'Mobile video updated successfully! ✨', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update mobile video.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDesktopVideo = async () => {
    if (!missionVideoDesktopUrl) return;
    const normalizedUrl = normalizeYoutubeUrl(missionVideoDesktopUrl);
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'mission_video_desktop_url',
        value: normalizedUrl,
        description: "URL for the 'Today's Mission' video on the desktop homescreen"
      });
      setMissionVideoDesktopUrl(normalizedUrl);
      setMessage({ text: 'Desktop video updated successfully! ✨', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update desktop video.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOnboardingVideo = async () => {
    if (!onboardingVideoUrl) return;
    const normalizedUrl = normalizeYoutubeUrl(onboardingVideoUrl);
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'onboarding_video_url',
        value: normalizedUrl,
        description: "YouTube link for onboarding video played when clicking the WhatsApp button on Welcome Screen"
      });
      setOnboardingVideoUrl(normalizedUrl);
      setMessage({ text: 'Onboarding video updated successfully! ✨', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update onboarding video.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearOnboardingVideo = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'onboarding_video_url',
        value: '',
        description: "YouTube link for onboarding video played when clicking the WhatsApp button on Welcome Screen"
      });
      setOnboardingVideoUrl('');
      setMessage({ text: 'Onboarding video cleared! WhatsApp button now directly opens chat. ✅', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to clear onboarding video.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlides = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'homepage_slides',
        value: homepageSlides,
        description: "List of 6 image URLs for the mobile homepage carousel"
      });
      setMessage({ text: 'Slides updated successfully! ✨', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update slides.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (index, value) => {
    const newSlides = [...homepageSlides];
    newSlides[index] = value;
    setHomepageSlides(newSlides);
  };

  const handleToggleMaintenance = async (newValue) => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'maintenance_mode',
        value: newValue,
        description: "If true, blocks the app and displays a maintenance screen"
      });
      setMaintenanceMode(newValue);
      setMessage({ text: newValue ? 'Maintenance Mode ENABLED! ⚠️' : 'Maintenance Mode DISABLED! ✅', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update maintenance mode.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleExamMode = async (newValue) => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'exam_mode_live',
        value: newValue,
        description: "If true, exam mode is open to normal users"
      });
      setExamModeLive(newValue);
      setMessage({ text: newValue ? 'Exam Mode is now LIVE for all students! 🚀' : 'Exam Mode set to BETA (Admins only) 🔒', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update Exam Mode setting.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChallenges = async (newValue) => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'challenges_live',
        value: newValue,
        description: "If true, challenges feature is open to normal users"
      });
      setChallengesLive(newValue);
      setMessage({ text: newValue ? 'Challenges feature is now LIVE for all students! 🎯' : 'Challenges set to BETA (Admins only) 🔒', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update Challenges setting.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrialSettings = async () => {
    try {
      setTrialSaving(true);
      setTrialMsg({ text: '', type: '' });
      await paymentService.updateAdminSettings({
        ...trialConfig,
        trialHours: Number(trialConfig.trialHours),
        passPrice: Number(trialConfig.passPrice),
        passOriginalPrice: Number(trialConfig.passOriginalPrice),
        guestLessonLimit: Number(trialConfig.guestLessonLimit),
        trialLessonLimit: Number(trialConfig.trialLessonLimit),
        passDays: Number(trialConfig.passDays),
      });
      setTrialMsg({ text: 'Free trial duration and Pro pricing updated live across all apps and web! ✨', type: 'success' });
      setTimeout(() => setTrialMsg({ text: '', type: '' }), 5000);
    } catch (err) {
      setTrialMsg({ text: err.response?.data?.message || 'Failed to save trial settings', type: 'error' });
    } finally {
      setTrialSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* FREE TRIAL TIME & PRICE SETTINGS */}
      <div className="rounded-3xl p-6 shadow-sm border border-indigo-200 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Free Trial &amp; Pro Plan Settings</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Changes update instantly in users' apps &amp; web without app release
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            Live Instant Sync
          </span>
        </div>

        {trialMsg.text && (
          <div className={`mb-4 p-3.5 rounded-xl text-xs font-bold ${trialMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {trialMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Trial Hours */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider mb-1">
              Free Trial Time (Hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="720"
                value={trialConfig.trialHours ?? 48}
                onChange={(e) => setTrialConfig({ ...trialConfig, trialHours: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-indigo-200 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-black text-indigo-600 shrink-0">Hours</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
              Countdown starts on first level played. Default: 48h.
            </p>
          </div>

          {/* Pro Pass Price */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
            <label className="block text-xs font-black text-amber-900 uppercase tracking-wider mb-1">
              Pro Pass Price (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-amber-700 shrink-0">₹</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={trialConfig.passPrice ?? 99}
                onChange={(e) => setTrialConfig({ ...trialConfig, passPrice: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
              Charged for Pro pass on web &amp; app. Default: ₹99.
            </p>
          </div>

          {/* Original Strikethrough Price */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
            <label className="block text-xs font-black text-rose-900 uppercase tracking-wider mb-1">
              Original Strikethrough (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-rose-700 shrink-0">₹</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={trialConfig.passOriginalPrice ?? 599}
                onChange={(e) => setTrialConfig({ ...trialConfig, passOriginalPrice: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-rose-200 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
              Shown crossed out next to price. Default: ₹599.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={handleSaveTrialSettings}
            disabled={trialSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            {trialSaving ? 'Saving...' : '💾 Save Free Trial & Pricing'}
          </button>
        </div>
      </div>
      {/* MAINTENANCE MODE SECTION */}
      <div className={`rounded-3xl p-6 shadow-sm border transition-all ${maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${maintenanceMode ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Maintenance Mode</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Toggle app access for all users</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleMaintenance(!maintenanceMode)}
            disabled={saving || loading}
            className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer ${
              saving || loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : maintenanceMode
                ? 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700'
                : 'bg-green-500 text-white shadow-lg shadow-green-100 hover:bg-green-600'
            }`}
          >
            {saving ? 'Saving...' : maintenanceMode ? 'Turn OFF Maintenance' : 'Turn ON Maintenance'}
          </button>
        </div>
        {maintenanceMode && (
          <div className="mt-4 p-4 bg-red-100/50 rounded-xl border border-red-200 text-red-700 text-sm font-semibold">
            ⚠️ WARNING: The app is currently inaccessible to users. They will see the maintenance screen until you turn this off.
          </div>
        )}
      </div>

      {/* FEATURE ACCESS & BETA RELEASES SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Feature Releases & Student Access</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Toggle student access between Live and Beta (Coming Soon)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* EXAM MODE TOGGLE */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${examModeLive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/40 border-amber-200'}`}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Exam Mode</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  examModeLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {examModeLive ? '🟢 Live for All' : '🔒 Beta (Admins Only)'}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                {examModeLive 
                  ? 'Exam Mode is currently LIVE for all registered students across all chapters.' 
                  : 'Normal students see the "Coming Soon" screen. Only Admin accounts can access and test.'}
              </p>
            </div>
            <button
              onClick={() => handleToggleExamMode(!examModeLive)}
              disabled={saving || loading}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                saving || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : examModeLive
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'
              }`}
            >
              {saving ? 'Saving...' : examModeLive ? 'Switch to Beta (Admins Only)' : 'Make Exam Mode Live 🚀'}
            </button>
          </div>

          {/* CHALLENGES TOGGLE */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${challengesLive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/40 border-amber-200'}`}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Challenges & Goals</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  challengesLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {challengesLive ? '🟢 Live for All' : '🔒 Beta (Admins Only)'}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                {challengesLive 
                  ? 'Challenges & Weekly Goals are currently LIVE for all students.' 
                  : 'Normal students see the "Coming Soon" screen. Only Admin accounts can access.'}
              </p>
            </div>
            <button
              onClick={() => handleToggleChallenges(!challengesLive)}
              disabled={saving || loading}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                saving || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : challengesLive
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'
              }`}
            >
              {saving ? 'Saving...' : challengesLive ? 'Switch to Beta (Admins Only)' : 'Make Challenges Live 🚀'}
            </button>
          </div>
        </div>
      </div>

      {/* MISSION VIDEO SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Today's Mission Video</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update the homescreen video link</p>
          </div>
        </div>

        <div className="space-y-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">Mobile Video Link</label>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={missionVideoUrl}
                  onChange={(e) => setMissionVideoUrl(e.target.value)}
                  placeholder="Paste YouTube link"
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-100 transition-all"
                  disabled={loading}
                />
                <button 
                  onClick={handleSaveVideo}
                  disabled={saving || loading || !missionVideoUrl}
                  className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                    saving || loading || !missionVideoUrl
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  {saving ? 'Saving...' : 'Update Mobile Video'}
                </button>
              </div>
            </div>

            {missionVideoUrl && (
              <div className="mt-4">
                <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-gray-100 bg-black">
                  <iframe className="w-full h-full" src={missionVideoUrl} title="Preview Mobile" frameBorder="0" allowFullScreen></iframe>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">Desktop Video Link (Optional)</label>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={missionVideoDesktopUrl}
                  onChange={(e) => setMissionVideoDesktopUrl(e.target.value)}
                  placeholder="Paste YouTube link (if different from mobile)"
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-100 transition-all"
                  disabled={loading}
                />
                <button 
                  onClick={handleSaveDesktopVideo}
                  disabled={saving || loading || !missionVideoDesktopUrl}
                  className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                    saving || loading || !missionVideoDesktopUrl
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  {saving ? 'Saving...' : 'Update Desktop Video'}
                </button>
              </div>
            </div>

            {missionVideoDesktopUrl && (
              <div className="mt-4">
                <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-gray-100 bg-black">
                  <iframe className="w-full h-full" src={missionVideoDesktopUrl} title="Preview Desktop" frameBorder="0" allowFullScreen></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ONBOARDING VIDEO (WHATSAPP MODAL) SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="text-xl">🎬</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Welcome Screen Onboarding Video</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Plays when a student clicks "Chat with us on WhatsApp" on the Welcome Screen
            </p>
          </div>
        </div>

        <div className="space-y-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider ml-1">
                YouTube Video Link (Shorts, Regular, or Embed)
              </label>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={onboardingVideoUrl}
                  onChange={(e) => setOnboardingVideoUrl(e.target.value)}
                  placeholder="Paste YouTube link (e.g. https://youtu.be/... or https://youtube.com/watch?v=...)"
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-emerald-100 transition-all"
                  disabled={loading}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleSaveOnboardingVideo}
                    disabled={saving || loading || !onboardingVideoUrl}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                      saving || loading || !onboardingVideoUrl
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save Onboarding Video'}
                  </button>

                  {onboardingVideoUrl && (
                    <button
                      onClick={handleClearOnboardingVideo}
                      disabled={saving || loading}
                      className="py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200"
                    >
                      Remove Video (Direct WhatsApp)
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 pt-1">
                ℹ️ <strong>Behavior:</strong> If a video link is set, clicking "Chat with us on WhatsApp" opens a popup modal playing this onboarding video first, with a button to proceed to WhatsApp if they still have questions. If left blank, it opens WhatsApp directly.
              </p>
            </div>
          </div>

          <div className="flex-1">
            {onboardingVideoUrl ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Live Video Preview</label>
                <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-emerald-100 bg-black shadow-sm">
                  <iframe 
                    className="w-full h-full" 
                    src={onboardingVideoUrl} 
                    title="Onboarding Video Preview" 
                    frameBorder="0" 
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[160px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50">
                <span className="text-3xl mb-2">💬</span>
                <span className="text-xs font-bold text-gray-500">No video currently set</span>
                <span className="text-[11px] text-gray-400 mt-1 max-w-xs">WhatsApp button currently opens direct WhatsApp chat without playing a video.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HOMEPAGE SLIDES SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Homepage Carousel Slides</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update the 6 images on the mobile home page</p>
          </div>
        </div>

        <div className="space-y-4">
          {homepageSlides.map((url, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-4 items-center bg-gray-50/50 p-4 rounded-[24px] border border-gray-100">
              <div className="w-12 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                {url ? <img src={url} alt={`Slide ${idx+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400"># {idx+1}</div>}
              </div>
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Slide {idx+1} Image URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => updateSlide(idx, e.target.value)}
                  placeholder="https://cloudinary.com/..."
                  className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-100 transition-all"
                />
              </div>
            </div>
          ))}

          <div className="pt-4">
            <button 
              onClick={handleSaveSlides}
              disabled={saving || loading}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                saving || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {saving ? 'Saving...' : 'Update All Slides'}
            </button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-center shadow-2xl animate-bounce ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default SystemSettingsManager;
