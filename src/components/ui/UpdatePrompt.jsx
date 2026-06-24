import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import axios from 'axios';

const CURRENT_VERSION_CODE = 28; // Updated to match your latest build
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app';

const UpdatePrompt = () => {
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Fetch the minimum required version from your settings API
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/min_android_version`);

                if (response.data && response.data.value) {
                    const minVersion = parseInt(response.data.value, 10);
                    if (CURRENT_VERSION_CODE < minVersion) {
                        setNeedsUpdate(true);
                    }
                }
            } catch (error) {
                console.error('Failed to check for updates:', error);
            } finally {
                setLoading(false);
            }
        };

        checkVersion();
    }, []);

    if (loading || !needsUpdate) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-[#1a1a2e] border border-blue-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Update Required</h2>
                <p className="text-gray-400 mb-8">
                    A new version of HoshiYaar is available with important fixes and features. Please update to continue.
                </p>

                <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                    Update Now
                </a>

                <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest">
                    v3.3 (Build {CURRENT_VERSION_CODE})
                </p>
            </div>
        </div>
    );
};

export default UpdatePrompt;
