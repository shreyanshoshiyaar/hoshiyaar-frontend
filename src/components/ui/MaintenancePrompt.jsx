import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { getApiBase } from '../../utils/apiBase';

const MaintenancePrompt = () => {
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const response = await axios.get(`${getApiBase()}/api/settings/maintenance_mode?t=${new Date().getTime()}`);
                // Assume it can be a string "true" or boolean true depending on how it was saved
                if (response.data && (response.data.value === true || response.data.value === 'true')) {
                    setIsMaintenance(true);
                } else {
                    setIsMaintenance(false);
                }
            } catch (error) {
                console.error('Failed to check maintenance mode:', error);
                // In case of error (e.g. backend down), we could optionally set it to true,
                // but the user's preference wasn't explicitly stated, so let's fail open.
            } finally {
                setLoading(false);
            }
        };

        checkMaintenance();
        
        // Poll every 10 seconds to automatically dismiss when maintenance is over
        const interval = setInterval(() => {
            checkMaintenance();
        }, 10000);
        
        return () => clearInterval(interval);
    }, []);

    // Never block the admin panel
    if (location.pathname.startsWith('/admin')) return null;

    if (loading || !isMaintenance) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-[#1a1a2e] border border-orange-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Under Maintenance</h2>
                <p className="text-gray-400 mb-6">
                    HoshiYaar is currently undergoing scheduled maintenance. We'll be back shortly. Thank you for your patience!
                </p>
                
                <div className="mt-4 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePrompt;
