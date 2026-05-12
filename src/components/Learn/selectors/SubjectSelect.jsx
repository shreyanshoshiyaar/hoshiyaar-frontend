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
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative font-sans">
            
            {/* Minimal Header */}
            <div className="px-6 pt-12 pb-4 text-center relative z-10">
                <h1 className="font-bold text-2xl md:text-3xl text-gray-800">
                    Choose a Subject
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    We’ll prepare lessons around it
                </p>
            </div>

            {/* Compact Main Content: Grid of subjects */}
            <div className="flex-grow flex items-center justify-center px-6 relative z-10">
                <div className="w-full max-w-sm grid grid-cols-2 gap-3">
                    {loading && (
                        <div className="col-span-2 text-center text-gray-400 text-sm animate-pulse py-12">
                            Loading...
                        </div>
                    )}
                    {!loading && subjects.length === 0 && (
                        <div className="col-span-2 text-center text-gray-400 text-sm py-12">
                            No subjects found.
                        </div>
                    )}
                    {!loading && subjects.map((subject) => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`py-5 px-4 text-center rounded-2xl border transition-all active:scale-[0.98] ${
                                selectedSubject === subject 
                                ? 'bg-white border-blue-400 shadow-sm' 
                                : 'bg-white/40 backdrop-blur-md border-white/40 hover:bg-white/60'
                            }`}
                        >
                            <span className={`font-semibold text-base ${
                                selectedSubject === subject ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                                {subject}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Minimal Footer with Small Button */}
            <div className="p-10 flex justify-center relative z-10">
                <button 
                    onClick={() => { updateData?.({ subject: selectedSubject }); onContinue?.(); }}
                    disabled={!selectedSubject}
                    className={`px-10 py-3.5 rounded-full font-bold text-base transition-all ${
                        !selectedSubject 
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

export default SubjectSelect;
