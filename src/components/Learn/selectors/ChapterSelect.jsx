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
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative font-outfit">
            
            {/* Header Area */}
            <div className="px-8 pt-16 pb-4 text-center animate-fade-in relative z-10">
                <h1 className="font-black text-4xl md:text-5xl text-[#1E293B] leading-tight tracking-tight drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]">
                    Pick a Chapter
                </h1>
                <p className="text-[#475569] font-extrabold mt-2 text-lg md:text-xl opacity-90">
                    Continue your journey
                </p>
            </div>

            {/* Main content: List of chapters - Centered */}
            <div className="flex-grow flex items-center justify-center px-6 relative z-10 overflow-hidden">
                <div className="w-full max-w-lg space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-6">
                    {loading && (
                        <div className="flex flex-col items-center gap-4 py-12">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-[#1E293B] font-black text-xl tracking-widest">LOADING...</div>
                        </div>
                    )}
                    {!loading && chapters.length === 0 && (<div className="text-center text-gray-500 font-bold py-12">No chapters found.</div>)}
                    {!loading && chapters.map((chapter, idx) => (
                        <button
                            key={chapter.id}
                            onClick={() => { 
                                setSelectedChapter(chapter.name); 
                                updateData?.({ chapter: chapter.name }); 
                            }}
                            style={{ animation: `slideUp 0.4s ease-out ${idx * 0.05}s both` }}
                            className={`w-full p-5 rounded-[2rem] border-2 flex items-center gap-5 transition-all active:scale-[0.98] ${
                                selectedChapter === chapter.name
                                ? 'bg-white border-blue-500 shadow-[0_20px_40px_rgba(59,130,246,0.2)] scale-[1.02]'
                                : 'bg-white/80 backdrop-blur-xl border-white/60 border-b-6 border-b-gray-400/20 hover:bg-white/90 shadow-lg'
                            }`}
                        >
                            {/* Premium Custom Radio */}
                            <div className={`w-9 h-9 rounded-full border-4 flex items-center justify-center transition-all shadow-inner shrink-0 ${
                                selectedChapter === chapter.name ? 'border-blue-500 bg-blue-500' : 'border-gray-200 bg-gray-50/50'
                            }`}>
                                {selectedChapter === chapter.name && (
                                    <div className="w-3 h-3 bg-white rounded-full shadow-md animate-scale-in" />
                                )}
                            </div>
                            <span className={`font-black text-lg md:text-xl text-left leading-tight transition-colors ${
                                selectedChapter === chapter.name ? 'text-blue-700' : 'text-[#334155]'
                            }`}>
                                {chapter.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer with Premium Button */}
            <div className="p-8 md:p-12 relative z-10">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedChapter}
                    className={`w-full font-black py-6 px-12 rounded-[2.5rem] text-2xl transition-all uppercase tracking-[0.2em] shadow-xl ${
                        !selectedChapter 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-b-8 border-b-gray-300' 
                        : 'bg-[#10B981] text-white hover:bg-[#059669] border-b-8 border-b-[#047857] hover:border-b-[#047857] active:border-b-0 active:translate-y-2'
                    }`}
                >
                    Continue
                </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}} />
        </div>
    );
};

export default ChapterSelect;
