import React from 'react';
import { Link } from 'react-router-dom'; // Import the Link component
import finalCTABackground from '../../assets/images/footer.png'; 

const FinalCTA = () => (
    <section 
        className="relative overflow-hidden"
        style={{ 
            backgroundImage: `url(${finalCTABackground})`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}
    >
        <div className="h-[110vh] relative container mx-auto px-4 text-center py-20 lg:py-32">
            <h2 className="text-4xl md:text-5xl font-extrabold text-duo-blue mb-8">learn a subject with hoshiyaar...!</h2>
            
            {/* Wrap the button in a Link component pointing to /signup */}
            <Link to="/signup">
                <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-4 px-10 rounded-2xl border-b-4 border-duo-blue hover:bg-blue-500 transition">
                    Get Started
                </button>
            </Link>
        </div>
    </section>
);

export default FinalCTA;
