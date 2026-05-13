import React, { useState, useEffect } from 'react';
import curriculumService from '../../services/curriculumService';

const SystemSettingsManager = () => {
  const [missionVideoUrl, setMissionVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await curriculumService.getSetting('mission_video_url');
      if (res.data) {
        setMissionVideoUrl(res.data.value || '');
      }
    } catch (err) {
      console.error('Failed to fetch setting', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!missionVideoUrl) return;
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await curriculumService.updateSetting({
        key: 'mission_video_url',
        value: missionVideoUrl,
        description: "URL for the 'Today's Mission' video on the homescreen"
      });
      setMessage({ text: 'Video updated successfully! ✨', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update video. Please try again.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
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
          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">YouTube Embed URL</label>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              value={missionVideoUrl}
              onChange={(e) => setMissionVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="flex-1 bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-100 transition-all"
              disabled={loading}
            />
            <button 
              onClick={handleSave}
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
          <p className="text-[10px] text-gray-400 font-medium ml-1">
            Tip: Use the 'Embed' link from YouTube (e.g., https://www.youtube.com/embed/VIDEO_ID)
          </p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-wider text-center animate-bounce ${
            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* Video Preview */}
        {missionVideoUrl && (
          <div className="mt-6">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Live Preview</label>
            <div className="aspect-video w-full max-w-xl mx-auto rounded-3xl overflow-hidden border-4 border-gray-50 shadow-inner bg-black">
              <iframe 
                className="w-full h-full"
                src={missionVideoUrl}
                title="Preview" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettingsManager;
