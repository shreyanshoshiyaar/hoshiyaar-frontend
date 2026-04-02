import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import heroChar from '../../../assets/images/heroChar.png';
import curriculumService from '../../../services/curriculumService.js';

const HoshiIcon = () => (
    <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0">
        <img src={heroChar} alt="Hoshi" className="w-24 h-24 object-contain" />
    </div>
);

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
        // Prevent running if already onboarded
        if (user?._id && user?.onboardingCompleted) {
            navigate('/learn', { replace: true });
            return;
        }
        
        const loadBoards = async () => {
            try {
                setError(null);
                const res = await curriculumService.listBoards();
                
                console.log('🔍 Boards API Response:', res);
                
                let boardNames = [];
                
                // Handle all possible response formats
                if (Array.isArray(res)) {
                    boardNames = res.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean);
                } else if (res?.data) {
                    if (Array.isArray(res.data)) {
                        boardNames = res.data.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean);
                    } else if (Array.isArray(res.data.boards)) {
                        boardNames = res.data.boards.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean);
                    } else if (Array.isArray(res.data.data)) {
                        boardNames = res.data.data.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean);
                    }
                } else if (res?.boards && Array.isArray(res.boards)) {
                    boardNames = res.boards.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean);
                }
                
                console.log('✅ Extracted boards:', boardNames);
                
                setBoards(boardNames);
                
                if (boardNames.length === 0) {
                    setError('No boards available');
                }
            } catch (error) {
                console.error('❌ Load boards error:', error);
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
        
        // Prefetch subjects
        try {
            const res = await curriculumService.listSubjects(val);
            let subjectNames = [];
            
            if (Array.isArray(res)) {
                subjectNames = res.map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
            } else if (res?.data && Array.isArray(res.data)) {
                subjectNames = res.data.map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
            }
            
            try { 
                sessionStorage.setItem(`subjects_cache_v1__${val}`, JSON.stringify(subjectNames));
            } catch(_) {}
        } catch (error) {
            console.error('Failed to prefetch subjects:', error);
        }
    };

    const handleContinue = () => {
        if (selectedBoard) {
            updateData?.({ board: selectedBoard });
            onContinue?.();
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
            <div className="bg-duo-blue text-white px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 shadow-[0_10px_0_0_rgba(0,0,0,0.08)]">
                <button onClick={onBack} className="p-2 rounded-full bg-white/15 hover:bg-white/25">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div>
                    <p className="font-extrabold text-2xl md:text-3xl">Which board do you belong to?</p>
                    <p className="opacity-90 text-base md:text-lg">We'll tailor content to your selection</p>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-start gap-6 mb-8">
                        <HoshiIcon />
                        <div className="bg-blue-50 text-duo-blue px-6 py-4 rounded-xl text-xl">Which board do you belong to?</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loading && <div className="col-span-2 text-center py-8 text-gray-500">Loading boards...</div>}
                        {error && <div className="col-span-2 text-center py-8 text-red-500">{error}</div>}
                        {!loading && !error && boards.length === 0 && <div className="col-span-2 text-center py-8 text-gray-500">No boards found</div>}
                        {boards.map(board => (
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

            <div className="border-t pt-6 px-6 pb-6 flex justify-end">
                <button 
                    onClick={handleContinue}
                    disabled={!selectedBoard || loading}
                    className="bg-green-600 text-white font-extrabold py-5 px-12 rounded-xl text-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 shadow-[0_6px_0_0_rgba(0,0,0,0.15)]"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default BoardSelect;