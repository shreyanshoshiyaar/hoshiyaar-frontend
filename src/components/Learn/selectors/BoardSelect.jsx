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

const BoardSelect = ({ onContinue, onBack, updateData, autoAdvance = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedBoard, setSelectedBoard] = useState('');
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?._id && user?.onboardingCompleted) {
            navigate('/learn', { replace: true });
            return;
        }
        
        const loadBoards = async () => {
            try {
                setError(null);
                const res = await curriculumService.listBoards();
                console.log('Boards API response:', res); // Debug log
                
                let boardNames = [];
                
                // Handle different response formats
                if (Array.isArray(res)) {
                    // Response is directly an array: [{ name: 'CBSE' }, ...]
                    boardNames = res.map(b => b.name || b);
                } else if (res?.data && Array.isArray(res.data)) {
                    // Response is { data: [...] }
                    boardNames = res.data.map(b => b.name || b);
                } else if (res?.boards && Array.isArray(res.boards)) {
                    // Response is { boards: [...] }
                    boardNames = res.boards.map(b => b.name || b);
                } else {
                    console.error('Unexpected boards response format:', res);
                    setError('Unexpected response format from server');
                    boardNames = [];
                }
                
                setBoards(boardNames.filter(Boolean)); // Remove any null/undefined
                
                if (boardNames.length === 0) {
                    console.warn('No boards found from API');
                    setError('No boards available');
                }
            } catch (error) {
                console.error('Failed to load boards:', error);
                setError(error.message || 'Failed to load boards');
                setBoards([]);
            } finally {
                setLoading(false);
            }
        };
        
        loadBoards();
    }, [user, navigate]);

    const handleSelection = async (e) => {
        const val = e.target.value;
        setSelectedBoard(val);
        
        // Step-ahead prefetch: subjects for chosen board
        try {
            const res = await curriculumService.listSubjects(val);
            console.log('Subjects API response:', res); // Debug log
            
            let subjectNames = [];
            
            // Handle different response formats
            if (Array.isArray(res)) {
                subjectNames = res.map(s => s.name || s);
            } else if (res?.data && Array.isArray(res.data)) {
                subjectNames = res.data.map(s => s.name || s);
            } else if (res?.subjects && Array.isArray(res.subjects)) {
                subjectNames = res.subjects.map(s => s.name || s);
            }
            
            try { 
                sessionStorage.setItem(
                    `subjects_cache_v1__${val}`, 
                    JSON.stringify(subjectNames.filter(Boolean) || [])
                ); 
            } catch(_) {}
        } catch (error) {
            console.error('Failed to prefetch subjects:', error);
        }
    };

    const handleContinue = async () => {
        if (selectedBoard) {
            updateData?.({ board: selectedBoard });
            onContinue?.();
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative">
            
            {/* Header Text - Direct on Background */}
            <div className="px-6 pt-12 pb-8 md:pt-16 text-center animate-fade-in relative z-10">
                <h1 className="font-black text-3xl md:text-4xl text-gray-900 leading-tight drop-shadow-sm">
                    Which board do you belong to?
                </h1>
                <p className="text-gray-700 font-bold mt-2 text-base md:text-lg opacity-80">
                    We'll tailor content to your selection
                </p>
            </div>

            {/* Main content area - Centered Grid */}
            <div className="flex-grow flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-lg space-y-4">
                    {loading && (
                        <div className="text-center text-gray-600 font-bold animate-pulse text-lg py-8">
                            Loading boards...
                        </div>
                    )}
                    {!loading && error && (
                        <div className="text-center text-red-500 font-bold py-8">
                            <p>{error}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-2xl shadow-lg"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!loading && boards.length > 0 && boards.map(board => (
                        <label key={board} className="block group">
                            <input 
                                type="radio" 
                                name="board" 
                                value={board} 
                                checked={selectedBoard === board} 
                                onChange={handleSelection}
                                className="hidden"
                            />
                            <div className={`p-6 border-2 rounded-[2rem] transition-all cursor-pointer flex items-center gap-4 ${
                                selectedBoard === board 
                                ? 'bg-white/90 border-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.2)] scale-[1.02]' 
                                : 'bg-white/60 backdrop-blur-md border-white/40 border-b-[6px] border-b-gray-200/50 hover:bg-white/70'
                            }`}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    selectedBoard === board ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                }`}>
                                    {selectedBoard === board && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="font-black text-xl text-gray-800">{board}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="p-6 md:p-10 relative z-10">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedBoard || loading}
                    className="w-full bg-green-600 text-white font-black py-5 px-12 rounded-[2rem] text-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_8px_0_0_#15803D] active:translate-y-1 active:shadow-none"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default BoardSelect;