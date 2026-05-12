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
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative">
            
            {/* Header Text - Direct on Background */}
            <div className="px-6 pt-12 pb-4 text-center animate-fade-in relative z-10">
                <h1 className="font-black text-3xl md:text-4xl text-gray-900 leading-tight drop-shadow-sm">
                    Pick a Chapter
                </h1>
                <p className="text-gray-700 font-bold mt-2 text-base opacity-80">
                    Continue your journey
                </p>
            </div>

            {/* Main content: List of chapters - Scrollable only if many items, but container is h-screen */}
            <div className="flex-grow flex items-center justify-center p-4 relative z-10 overflow-hidden">
                <div className="w-full max-w-lg space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar">
                    {loading && (<div className="text-center text-gray-600 font-bold animate-pulse text-lg py-8">Loading chapters...</div>)}
                    {!loading && chapters.length === 0 && (<div className="text-center text-gray-500 font-bold py-8">No chapters found.</div>)}
                    {!loading && chapters.map((chapter) => (
                        <button
                            key={chapter.id}
                            onClick={() => { 
                                setSelectedChapter(chapter.name); 
                                updateData?.({ chapter: chapter.name }); 
                            }}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                                selectedChapter === chapter.name
                                ? 'bg-white border-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.2)] scale-[1.02]'
                                : 'bg-white/60 backdrop-blur-md border-white/40 border-b-[6px] border-b-gray-200/50 hover:bg-white/70'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                selectedChapter === chapter.name ? 'border-green-500 bg-green-500' : 'border-gray-300'
                            }`}>
                                {selectedChapter === chapter.name && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="font-black text-lg text-gray-800 text-left leading-tight">{chapter.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="p-6 md:p-10 relative z-10">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedChapter}
                    className="w-full bg-green-600 text-white font-black py-5 px-12 rounded-[2rem] text-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_8px_0_0_#15803D] active:translate-y-1 active:shadow-none"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default ChapterSelect;
