import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import heroChar from '../../../assets/images/heroChar.png';
import curriculumService from '../../../services/curriculumService.js';

// Reusable component for the Hoshi character display
const HoshiCharacter = () => (
    <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0">
        <img src={heroChar} alt="Hoshi" className="w-24 h-24 object-contain" />
    </div>
);

// Reusable component for the back arrow
const BackArrow = ({ onClick }) => (
    <button onClick={onClick} className="absolute top-8 left-8 text-gray-500 hover:text-black">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
    </button>
);

// Placeholder icons for chapters
const TreeIcon = () => <span className="text-2xl">🌳</span>;
const HumanBodyIcon = () => <span className="text-2xl">🧍</span>;
const DefaultIcon = () => <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 border-gray-400" />;


const ChapterSelect = ({ onContinue, onBack, updateData, autoAdvance = false, board, subject }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id && (user?.onboardingCompleted || (user?.board && user?.subject))) {
            navigate('/learn', { replace: true });
            return;
        }
        const cacheKey = (b,s) => `chapters_cache_v1__${b}__${s}`;
        const loadCache = (b,s) => { try { return JSON.parse(sessionStorage.getItem(cacheKey(b,s)) || '[]') || []; } catch(_) { return []; } };
        const saveCache = (b,s,arr) => { try { sessionStorage.setItem(cacheKey(b,s), JSON.stringify(arr || [])); } catch(_) {} };
        if (!board || !subject) {
            setChapters([]);
            setLoading(false);
            return;
        }
        const loadChapters = async () => {
            try {
                // Hydrate from cache first for instant paint
                const cached = loadCache(board, subject);
                if (cached.length > 0) setChapters(cached);
                const res = await curriculumService.listChapters(board, subject);
                const list = (res?.data || []).map((c, idx) => ({ id: c._id, name: c.title, order: c.order ?? idx + 1 }));
                setChapters(list);
                if (list && list.length > 0) saveCache(board, subject, list);
                // Manual selection only - no auto-selection
            } catch (_) {
                setChapters([]);
            } finally {
                setLoading(false);
            }
        };
        loadChapters();
    }, [board, subject]);

    const handleContinue = () => {
        updateData({ chapter: selectedChapter });
        onContinue?.(selectedChapter);
    };

    return (
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative font-sans">
            
            {/* Top Content Group */}
            <div className="px-6 pt-10 flex flex-col items-center relative z-10 w-full max-w-sm mx-auto">
                {/* Header Text */}
                <div className="text-center mb-6">
                    <h1 className="font-bold text-2xl md:text-3xl text-gray-800">
                        Pick a Chapter
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Continue your journey
                    </p>
                </div>

                {/* Compact Main Content: List of chapters */}
                <div className="w-full space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                    {loading && (
                        <div className="text-center text-gray-400 text-sm animate-pulse py-8">
                            Loading...
                        </div>
                    )}
                    {!loading && chapters.length === 0 && (<div className="text-center text-gray-400 text-sm py-8">No chapters found.</div>)}
                    {!loading && chapters.map((chapter) => (
                        <button
                            key={chapter.id}
                            onClick={() => { 
                                setSelectedChapter(chapter.name); 
                                updateData?.({ chapter: chapter.name }); 
                            }}
                            className={`w-full py-3 px-5 rounded-2xl border transition-all active:scale-[0.98] flex items-center gap-4 ${
                                selectedChapter === chapter.name
                                ? 'bg-white border-blue-400 shadow-sm'
                                : 'bg-white/40 backdrop-blur-md border-white/40 hover:bg-white/60'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                selectedChapter === chapter.name ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                                {selectedChapter === chapter.name && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                )}
                            </div>
                            <span className={`font-semibold text-base transition-colors text-left leading-tight ${
                                selectedChapter === chapter.name ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                                {chapter.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-grow" />

            {/* Bottom Button - Full width within container */}
            <div className="p-10 flex justify-center relative z-10 w-full max-w-sm mx-auto">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedChapter}
                    className={`w-full py-4 rounded-full font-bold text-base transition-all ${
                        !selectedChapter 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95'
                    }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default ChapterSelect;
