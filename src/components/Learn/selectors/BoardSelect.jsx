import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import heroChar from '../../../assets/images/heroChar.png';
import curriculumService from '../../../services/curriculumService.js';

// A placeholder for the character icon
const HoshiIcon = () => (
    <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0">
        <img src={heroChar} alt="Hoshi" className="w-24 h-24 object-contain" />
    </div>
);

// Reusable component for the radio button options
const BoardOption = ({ label, value, selectedValue, onChange }) => (
    <label className="flex items-center gap-5 cursor-pointer">
        <input 
            type="radio" 
            name="board" 
            value={value} 
            checked={selectedValue === value} 
            onChange={onChange}
            className="w-7 h-7"
        />
        <div className={`flex-grow p-6 border-2 rounded-2xl text-left ${selectedValue === value ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
            <span className="font-extrabold text-xl">{label}</span>
        </div>
    </label>
);


import authService from '../../../services/authService.js';

const BoardSelect = ({ onContinue, onBack, updateData, autoAdvance = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedBoard, setSelectedBoard] = useState('');
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id && user?.onboardingCompleted) {
            navigate('/learn', { replace: true });
            return;
        }
        const loadBoards = async () => {
            try {
                const res = await curriculumService.listBoards();
                const names = (res?.data || []).map(b => b.name);
                setBoards(names);
                // Manual selection only - no auto-selection
                
                // If no boards found, show error message
                if (names.length === 0) {
                    console.warn('No boards found from API');
                }
            } catch (error) {
                console.error('Failed to load boards:', error);
                setBoards([]);
                // Could show a retry button or error message here
            } finally {
                setLoading(false);
            }
        };
        loadBoards();
    }, []);

    const handleSelection = async (e) => {
        const val = e.target.value;
        setSelectedBoard(val);
        // Step-ahead prefetch: subjects for chosen board
        try {
            const res = await curriculumService.listSubjects(val);
            const names = (res?.data || []).map(s => s.name);
            try { sessionStorage.setItem(`subjects_cache_v1__${val}`, JSON.stringify(names || [])); } catch(_) {}
        } catch (_) {}
        // Manual selection only - no auto-advance
    };

    const handleContinue = async () => {
        if (selectedBoard) {
            updateData?.({ board: selectedBoard });
            onContinue?.();
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
            {/* Header bar consistent with dashboard */}
            <div className="bg-duo-blue text-white px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 shadow-[0_10px_0_0_rgba(0,0,0,0.08)]">
                <button onClick={onBack} className="p-2 rounded-full bg-white/15 hover:bg-white/25">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div>
                    <p className="font-extrabold text-2xl md:text-3xl">Which board do you belong to?</p>
                    <p className="opacity-90 text-base md:text-lg">We’ll tailor content to your selection</p>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-start gap-6 mb-8">
                        <HoshiIcon />
                        <div className="bg-blue-50 text-duo-blue px-6 py-4 rounded-xl text-xl">Which board do you belong to?</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loading && (
                            <div className="col-span-2 text-gray-500 text-lg">Loading boards...</div>
                        )}
                        {!loading && boards.length === 0 && (
                            <div className="col-span-2 text-gray-500 text-lg">No boards found.</div>
                        )}
                        {!loading && boards.map(board => (
                            <BoardOption 
                                key={board} 
                                label={board} 
                                value={board} 
                                selectedValue={selectedBoard} 
                                onChange={handleSelection} 
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="border-t pt-6 px-6 pb-6 flex justify-end">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedBoard}
                    className="bg-green-600 text-white font-extrabold py-5 px-12 rounded-xl text-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_6px_0_0_rgba(0,0,0,0.15)]"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default BoardSelect;
