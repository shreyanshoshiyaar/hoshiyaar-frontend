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
        <div className="flex flex-col h-screen bg-transparent md:bg-gradient-to-b md:from-blue-50 md:via-white md:to-blue-50 overflow-hidden relative font-outfit">
            
            {/* Header Area */}
            <div className="px-8 pt-16 pb-6 text-center animate-fade-in relative z-10">
                <h1 className="font-black text-4xl md:text-5xl text-[#1E293B] leading-tight tracking-tight drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]">
                    Which board do you belong to?
                </h1>
                <p className="text-[#475569] font-extrabold mt-2 text-lg md:text-xl opacity-90">
                    We'll tailor content to your selection
                </p>
            </div>

            {/* Main Content - Centered and Spaced */}
            <div className="flex-grow flex items-center justify-center px-6 relative z-10">
                <div className="w-full max-w-lg space-y-5">
                    {loading && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-[#1E293B] font-black text-xl tracking-widest">LOADING...</div>
                        </div>
                    )}
                    
                    {!loading && boards.length > 0 && boards.map((board, idx) => (
                        <label 
                            key={board} 
                            className="block group transition-all active:scale-[0.97]"
                            style={{ animation: `slideUp 0.4s ease-out ${idx * 0.1}s both` }}
                        >
                            <input 
                                type="radio" 
                                name="board" 
                                value={board} 
                                checked={selectedBoard === board} 
                                onChange={handleSelection}
                                className="hidden"
                            />
                            <div className={`p-6 rounded-[2.5rem] transition-all cursor-pointer flex items-center gap-6 border-2 ${
                                selectedBoard === board 
                                ? 'bg-white border-blue-500 shadow-[0_20px_40px_rgba(59,130,246,0.2)] scale-[1.02]' 
                                : 'bg-white/80 backdrop-blur-xl border-white/60 border-b-8 border-b-gray-400/20 hover:bg-white/90 shadow-lg'
                            }`}>
                                {/* Premium Custom Radio */}
                                <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all shadow-inner ${
                                    selectedBoard === board ? 'border-blue-500 bg-blue-500' : 'border-gray-200 bg-gray-50/50'
                                }`}>
                                    {selectedBoard === board && (
                                        <div className="w-3.5 h-3.5 bg-white rounded-full shadow-md animate-scale-in" />
                                    )}
                                </div>
                                <span className={`font-black text-xl md:text-2xl transition-colors ${
                                    selectedBoard === board ? 'text-blue-700' : 'text-[#334155]'
                                }`}>
                                    {board}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Footer with Floating Action Button style */}
            <div className="p-8 md:p-12 relative z-10">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedBoard || loading}
                    className={`w-full font-black py-6 px-12 rounded-[2.5rem] text-2xl transition-all uppercase tracking-[0.2em] shadow-xl ${
                        !selectedBoard || loading 
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

export default BoardSelect;