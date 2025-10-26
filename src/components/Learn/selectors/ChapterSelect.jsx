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
        <div className="flex flex-col h-screen relative bg-gradient-to-b from-blue-50 via-white to-blue-50">
            {/* Header */}
            <div className="bg-duo-blue text-white px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 shadow-[0_10px_0_0_rgba(0,0,0,0.08)]">
                <button onClick={onBack} className="p-2 rounded-full bg-white/15 hover:bg-white/25">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                    <p className="font-extrabold text-2xl md:text-3xl">Pick a Chapter</p>
                    <p className="opacity-90 text-base md:text-lg">Continue your journey</p>
                </div>
            </div>

            {/* Main content: List of chapters */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-8 mb-8">
                        <HoshiCharacter />
                        <div className="bg-blue-50 p-5 rounded-lg w-full text-duo-blue">
                            <p className="text-xl">Ready to learn? Pick a chapter to start!</p>
                        </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {loading && (<div className="text-gray-500 text-lg">Loading chapters...</div>)}
                        {!loading && chapters.length === 0 && (<div className="text-gray-500 text-lg">No chapters found.</div>)}
                        {!loading && chapters.map((chapter) => (
                            <button
                                key={chapter.id}
                                onClick={() => { 
                                    setSelectedChapter(chapter.name); 
                                    updateData?.({ chapter: chapter.name }); 
                                    // Manual selection only - no auto-advance
                                }}
                                className={`w-full p-4 sm:p-5 md:p-6 rounded-2xl border-2 flex items-center gap-4 sm:gap-5 md:gap-6 text-left text-lg sm:text-xl font-extrabold transition-colors ${
                                    selectedChapter === chapter.name
                                    ? 'bg-green-200 border-green-500'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <DefaultIcon />
                                <span className="font-bold">{chapter.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="border-t pt-6 px-6 pb-6 flex justify-end">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedChapter}
                    className="bg-green-600 text-white font-extrabold py-5 px-12 rounded-xl text-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_6px_0_0_rgba(0,0,0,0.15)]"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default ChapterSelect;
