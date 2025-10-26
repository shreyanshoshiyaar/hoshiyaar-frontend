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
        <div className="flex flex-col h-screen relative bg-gradient-to-b from-blue-50 via-white to-blue-50">
            {/* Header bar */}
            <div className="bg-duo-blue text-white px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 shadow-[0_10px_0_0_rgba(0,0,0,0.08)]">
                <button onClick={onBack} className="p-2 rounded-full bg-white/15 hover:bg-white/25">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                    <p className="font-extrabold text-2xl md:text-3xl">Choose a Subject</p>
                    <p className="opacity-90 text-base md:text-lg">We’ll prepare lessons around it</p>
                </div>
            </div>

            {/* Main content: Grid of subjects */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-8 mb-8">
                        <HoshiCharacter />
                        <div className="bg-blue-50 p-5 rounded-lg w-full text-duo-blue">
                            <p className="text-xl">Which subject should we explore today?</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {loading && (
                            <div className="col-span-2 sm:col-span-3 text-gray-500 text-lg">Loading subjects...</div>
                        )}
                        {!loading && subjects.length === 0 && (
                            <div className="col-span-2 sm:col-span-3 text-gray-500 text-lg">No subjects found.</div>
                        )}
                        {!loading && subjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={async () => { 
                                    setSelectedSubject(subject); 
                                    // Step-ahead prefetch: chapters for chosen subject
                                    try {
                                        const res = await curriculumService.listChapters(selectedBoard || 'CBSE', subject);
                                        const list = (res?.data || []).map((c, idx) => ({ id: c._id, name: c.title, order: c.order ?? idx + 1 }));
                                        try { sessionStorage.setItem(`chapters_cache_v1__${selectedBoard || 'CBSE'}__${subject}`, JSON.stringify(list || [])); } catch(_) {}
                                    } catch (_) {}
                                    // Manual selection only - no auto-advance
                                }}
                                className={`p-8 text-center rounded-2xl border-2 text-xl font-extrabold transition-colors ${
                                    selectedSubject === subject 
                                    ? 'bg-green-200 border-green-500' 
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <span className="font-bold">{subject}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="border-t pt-6 px-6 pb-6 flex justify-end">
                <button 
                    onClick={() => { updateData?.({ subject: selectedSubject }); onContinue?.(); }}
                    disabled={!selectedSubject}
                    className="bg-green-600 text-white font-extrabold py-5 px-12 rounded-xl text-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_6px_0_0_rgba(0,0,0,0.15)]"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default SubjectSelect;
