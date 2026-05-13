import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';

const SystemSettingsManager = () => {
  const [missionVideoUrl, setMissionVideoUrl] = useState('');
  const [homepageSlides, setHomepageSlides] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const resVideo = await curriculumService.getSetting('mission_video_url');
      if (resVideo.data) {
        setMissionVideoUrl(resVideo.data.value || '');
      }
      const resSlides = await curriculumService.getSetting('homepage_slides');
      if (resSlides.data && Array.isArray(resSlides.data.value)) {
        setHomepageSlides(resSlides.data.value);
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
      setMessage({ text: 'Video updated successfully! ✨', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update video.', type: 'error' });
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
        description: "List of 5 image URLs for the mobile homepage carousel"
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

  return (
    <div className="space-y-6">
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

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">YouTube Link (Shorts/Standard/Embed)</label>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" 
                value={missionVideoUrl}
                onChange={(e) => setMissionVideoUrl(e.target.value)}
                placeholder="Paste YouTube link"
                className="flex-1 bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-100 transition-all"
                disabled={loading}
              />
              <button 
                onClick={handleSaveVideo}
                disabled={saving || loading || !missionVideoUrl}
                className={`px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                  saving || loading || !missionVideoUrl
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                }`}
              >
                {saving ? 'Saving...' : 'Update Video'}
              </button>
            </div>
          </div>

          {missionVideoUrl && (
            <div className="mt-4">
              <div className="aspect-video w-full max-w-sm rounded-2xl overflow-hidden border-2 border-gray-100 bg-black">
                <iframe className="w-full h-full" src={missionVideoUrl} title="Preview" frameBorder="0" allowFullScreen></iframe>
              </div>
            </div>
          )}
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update the 5 images on the mobile home page</p>
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
