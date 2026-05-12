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
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative">
            
            {/* Header Text - Direct on Background */}
            <div className="px-6 pt-12 pb-6 text-center animate-fade-in relative z-10">
                <h1 className="font-black text-3xl md:text-4xl text-gray-900 leading-tight drop-shadow-sm">
                    Choose a Subject
                </h1>
                <p className="text-gray-700 font-bold mt-2 text-base opacity-80">
                    We’ll prepare lessons around it
                </p>
            </div>

            {/* Main content: Grid of subjects - Centered */}
            <div className="flex-grow flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-4xl grid grid-cols-2 gap-4">
                    {loading && (
                        <div className="col-span-2 text-center text-gray-600 font-bold animate-pulse text-lg py-8">
                            Loading subjects...
                        </div>
                    )}
                    {!loading && subjects.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 font-bold py-8">
                            No subjects found.
                        </div>
                    )}
                    {!loading && subjects.map((subject) => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`p-6 text-center rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                                selectedSubject === subject 
                                ? 'bg-white border-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.2)] scale-[1.02]' 
                                : 'bg-white/60 backdrop-blur-md border-white/40 border-b-[6px] border-b-gray-200/50 hover:bg-white/70'
                            }`}
                        >
                            <span className="font-black text-lg text-gray-800">{subject}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="p-6 md:p-10 relative z-10">
                <button 
                    onClick={() => { updateData?.({ subject: selectedSubject }); onContinue?.(); }}
                    disabled={!selectedSubject}
                    className="w-full bg-green-600 text-white font-black py-5 px-12 rounded-[2rem] text-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_8px_0_0_#15803D] active:translate-y-1 active:shadow-none"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default SubjectSelect;
