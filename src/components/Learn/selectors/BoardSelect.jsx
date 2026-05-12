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
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative font-sans">
            
            {/* Top Content Group */}
            <div className="px-6 pt-10 flex flex-col items-center relative z-10 w-full max-w-sm mx-auto">
                {/* Header Text */}
                <div className="text-center mb-6">
                    <h1 className="font-bold text-2xl md:text-3xl text-gray-800">
                        Which board do you belong to?
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        We'll tailor content to your selection
                    </p>
                </div>

                {/* Options List */}
                <div className="w-full space-y-2.5">
                    {loading && (
                        <div className="text-center text-gray-400 text-sm animate-pulse">Loading...</div>
                    )}
                    
                    {!loading && boards.length > 0 && boards.map(board => (
                        <label key={board} className="block transition-all active:scale-[0.98]">
                            <input 
                                type="radio" 
                                name="board" 
                                value={board} 
                                checked={selectedBoard === board} 
                                onChange={handleSelection}
                                className="hidden"
                            />
                            <div className={`py-3.5 px-5 rounded-2xl transition-all cursor-pointer flex items-center gap-4 border ${
                                selectedBoard === board 
                                ? 'bg-white border-blue-400 shadow-sm' 
                                : 'bg-white/40 backdrop-blur-md border-white/40 hover:bg-white/60'
                            }`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    selectedBoard === board ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}>
                                    {selectedBoard === board && (
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </div>
                                <span className={`font-semibold text-base ${
                                    selectedBoard === board ? 'text-blue-600' : 'text-gray-700'
                                }`}>
                                    {board}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-grow" />

            {/* Bottom Button - Full width within container */}
            <div className="p-10 flex justify-center relative z-10 w-full max-w-sm mx-auto">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedBoard || loading}
                    className={`w-full py-4 rounded-full font-bold text-base transition-all ${
                        !selectedBoard || loading 
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

export default BoardSelect;