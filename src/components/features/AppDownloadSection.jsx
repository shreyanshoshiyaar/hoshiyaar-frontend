// src/components/AppDownloadSection.jsx

import React from 'react';
import { AppStoreIcon, GooglePlayIcon } from '../ui/Icons';
import appBackground from '../../assets/images/bg.png'; // Make sure this is your background image file

const AppDownloadSection = () => (
    // The section is now full-width again (no max-width or mx-auto)
    <section 
        className="py-20 lg:py-32 bg-duo-light-blue relative"
        style={{ 
            backgroundImage: `url(${appBackground})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}
    >
        {/* We re-introduce the 'container' to center the content */}
        <div className="container w-full h-[110vh] mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-duo-text mb-8">Learn anything, anytime, anywhere — your pace, your way.</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                
                <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-3 px-10 rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition">
                    App Store
                </button>
                <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-3 px-10 rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition">
                    Google Play
                </button>

            </div>
        </div>
    </section>
);

export default AppDownloadSection;