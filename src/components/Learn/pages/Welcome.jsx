import React, { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import heroChar from '../../../assets/images/heroChar.png';

// A placeholder for the character image. You can replace this with your actual image.
const CharacterPlaceholder = () => (
    <div className="w-48 h-48 rounded-2xl flex items-center justify-center">
        <img src={heroChar} alt="Hoshi" className="w-48 h-48 object-contain" />
    </div>
);

const Welcome = ({ onContinue }) => {
    const { user } = useAuth(); // Get user info to display their name
    const navigate = useNavigate();

    useEffect(() => {
        if (user?._id && user?.onboardingCompleted) {
            navigate('/learn', { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
            {/* Header bar */}
            <div className="bg-duo-blue text-white px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 flex items-center gap-3 sm:gap-4 shadow-[0_4px_0_0_rgba(0,0,0,0.08)]">
                <div>
                    <p className="font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl">Welcome</p>
                    <p className="opacity-90 text-sm sm:text-base md:text-lg">Hi {user?.name || 'there'}, I'm Hoshi!</p>
                </div>
            </div>

            {/* Main content area with speech bubble */}
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 sm:p-6">
                <div className="relative max-w-sm sm:max-w-md md:max-w-lg">
                    {/* Speech bubble */}
                    <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-200 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl shadow-md text-sm sm:text-base md:text-lg lg:text-xl text-overflow-fix">
                        Hi, I'm Hoshi
                    </div>
                    <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto">
                        <img src={heroChar} alt="Hoshi" className="w-full h-full object-contain" />
                    </div>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-blue-700 text-overflow-fix px-2">
                        Let's start your learning journey!
                    </p>
                </div>
            </div>

            {/* Footer with Continue button */}
            <div className="border-t pt-4 pb-4 sm:pt-6 sm:pb-6 px-4 sm:px-6 flex justify-center sm:justify-end">
                <button 
                    onClick={onContinue}
                    className="bg-green-600 text-white font-extrabold py-3 px-8 sm:py-4 sm:px-10 md:py-5 md:px-12 rounded-lg sm:rounded-xl text-base sm:text-lg md:text-xl hover:bg-green-700 transition-colors shadow-[0_4px_0_0_rgba(0,0,0,0.15)] w-full sm:w-auto btn-responsive"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default Welcome;
