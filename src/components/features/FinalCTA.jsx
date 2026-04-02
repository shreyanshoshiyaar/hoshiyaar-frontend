import React from 'react';
import { Link } from 'react-router-dom';
import HoshiPencil from '../../assets/images/Hoshi Pencil.webp';
import HoshiScience from '../../assets/images/Hoshi Science.webp';
import HoshiYaarLogo from '../../assets/images/HoshiYaar-logo.jpg';

const FinalCTA = () => (
    <section className="relative overflow-hidden bg-gray-50">
        <div className="relative container mx-auto px-4 text-center py-16 md:py-24">
            {/* Decorative Images */}
          
            <img 
                src={HoshiScience} 
                alt="Hoshi with science" 
                className="absolute right-0 md:right-10 top-1/2 -translate-y-1/2 w-48 md:w-64 lg:w-80 opacity-80 hidden sm:block"
            />
            
            <img 
                src={HoshiYaarLogo} 
                alt="HoshiYaar Logo" 
                className="mx-auto w-32 md:w-40 lg:w-48 mb-4"
            />
            
            <p className="text-2xl md:text-3xl text-duo-blue mb-8">Where chapters turn into adventures.</p>
            
            <Link to="/signup">
                <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-4 px-10 rounded-2xl border-b-4 border-duo-blue hover:bg-blue-500 transition">
                    Get Started
                </button>
            </Link>
        </div>
    </section>
);

export default FinalCTA;