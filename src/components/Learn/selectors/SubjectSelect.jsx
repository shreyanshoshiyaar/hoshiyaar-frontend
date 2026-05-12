import React, { useEffect, useState } from 'react';
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


const SubjectSelect = ({ onContinue, onBack, updateData, selectedBoard, autoAdvance = false }) => {
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const cacheKey = (board) => `subjects_cache_v1__${board}`;
    const loadCache = (board) => {
        try { return JSON.parse(sessionStorage.getItem(cacheKey(board)) || '[]') || []; } catch(_) { return []; }
    };
    const saveCache = (board, arr) => {
        try { sessionStorage.setItem(cacheKey(board), JSON.stringify(arr || [])); } catch(_) {}
    };

    useEffect(() => {
        if (!selectedBoard) {
            setSubjects([]);
            setLoading(false);
            return;
        }
        const loadSubjects = async () => {
            try {
                // Hydrate from cache first for instant paint
                const cached = loadCache(selectedBoard);
                if (cached.length > 0) setSubjects(cached);
                // Fetch subjects for the selected board
                const res = await curriculumService.listSubjects(selectedBoard);
                const names = (res?.data || []).map(s => s.name);
                setSubjects(names);
                if (names && names.length > 0) saveCache(selectedBoard, names);
                // Manual selection only - no auto-selection
            } catch (_) {
                setSubjects([]);
            } finally {
                setLoading(false);
            }
        };
        loadSubjects();
    }, [selectedBoard]);

    return (
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative font-outfit">
            
            {/* Header Area */}
            <div className="px-8 pt-16 pb-4 text-center animate-fade-in relative z-10">
                <h1 className="font-black text-4xl md:text-5xl text-[#1E293B] leading-tight tracking-tight drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]">
                    Choose a Subject
                </h1>
                <p className="text-[#475569] font-extrabold mt-2 text-lg md:text-xl opacity-90">
                    We’ll prepare lessons around it
                </p>
            </div>

            {/* Main content: Grid of subjects - Centered */}
            <div className="flex-grow flex items-center justify-center px-6 relative z-10">
                <div className="w-full max-w-4xl grid grid-cols-2 gap-5">
                    {loading && (
                        <div className="col-span-2 flex flex-col items-center gap-4 py-12">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-[#1E293B] font-black text-xl tracking-widest">LOADING...</div>
                        </div>
                    )}
                    {!loading && subjects.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 font-bold py-12">
                            No subjects found.
                        </div>
                    )}
                    {!loading && subjects.map((subject, idx) => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            style={{ animation: `slideUp 0.4s ease-out ${idx * 0.1}s both` }}
                            className={`p-6 text-center rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.97] ${
                                selectedSubject === subject 
                                ? 'bg-white border-blue-500 shadow-[0_20px_40px_rgba(59,130,246,0.2)] scale-[1.02]' 
                                : 'bg-white/80 backdrop-blur-xl border-white/60 border-b-8 border-b-gray-400/20 hover:bg-white/90 shadow-lg'
                            }`}
                        >
                            <span className={`font-black text-xl md:text-2xl transition-colors ${
                                selectedSubject === subject ? 'text-blue-700' : 'text-[#334155]'
                            }`}>
                                {subject}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer with Premium Button */}
            <div className="p-8 md:p-12 relative z-10">
                <button 
                    onClick={() => { updateData?.({ subject: selectedSubject }); onContinue?.(); }}
                    disabled={!selectedSubject}
                    className={`w-full font-black py-6 px-12 rounded-[2.5rem] text-2xl transition-all uppercase tracking-[0.2em] shadow-xl ${
                        !selectedSubject 
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
            `}} />
        </div>
    );
};

export default SubjectSelect;
