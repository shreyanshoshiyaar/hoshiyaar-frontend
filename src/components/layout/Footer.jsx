import React from 'react';
import { Link } from 'react-router-dom';

// Import the logo
import FooterLogo from '../../assets/images/HoshiYaar (1).webp';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{ backgroundColor: '#1E65FA' }} className="text-white w-full">
            {/* Main Container: 'max-w-screen-2xl' ensures it stretches nicely on large screens */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
                
                {/* GRID LAYOUT: 
                    - Mobile: 1 column (compact stack)
                    - Tablet: 2 columns (balanced)
                    - Desktop: 4 columns (fills horizontal space completely) 
                */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 mb-8">
                    
                    {/* COLUMN 1: BRANDING (Logo & Tagline) */}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
                        <Link to="/">
                            <img
                                src={FooterLogo}
                                alt="HoshiYaar Logo"
                                // Logo is large and dominant
                                className="h-20 sm:h-24 md:h-28 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-white/90 text-sm leading-relaxed max-w-xs">
                            Empowering students with interactive learning. Join the HoshiYaar community today and start your journey!
                        </p>
                    </div>

                    {/* COLUMN 2: EXPLORE (Navigation) */}
                    <div className="flex flex-col items-center sm:items-start space-y-4">
                        <h3 className="font-bold text-lg border-b-2 border-white/30 pb-1 w-full sm:w-auto text-center sm:text-left">Explore</h3>
                        <ul className="space-y-2 text-center sm:text-left text-white/90">
                            <li><Link to="/" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Home</Link></li>
                            <li><Link to="/about" className="hover:text-white hover:translate-x-1 transition-transform inline-block">About Us</Link></li>
                            <li><Link to="/courses" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Courses</Link></li>
                            <li><Link to="/contact" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 3: LEGAL (Policies) */}
                    <div className="flex flex-col items-center sm:items-start space-y-4">
                        <h3 className="font-bold text-lg border-b-2 border-white/30 pb-1 w-full sm:w-auto text-center sm:text-left">Legal</h3>
                        <ul className="space-y-2 text-center sm:text-left text-white/90">
                            <li><Link to="/privacy-policy" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Privacy Policy</Link></li>
                            <li><Link to="/terms-conditions" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Terms of Service</Link></li>
                            <li><Link to="/disclaimer" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Disclaimer</Link></li>
                            <li><Link to="/refund-policy" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Refund Policy</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 4: SOCIALS (Connect) */}
                    <div className="flex flex-col items-center sm:items-start space-y-4">
                        <h3 className="font-bold text-lg border-b-2 border-white/30 pb-1 w-full sm:w-auto text-center sm:text-left">Connect With Us</h3>
                        <p className="text-sm text-white/80 text-center sm:text-left">Follow us on social media for updates and free tips.</p>
                        
                        <div className="flex gap-4 mt-2">
                            {/* Instagram */}
                            <a href="https://www.instagram.com/hoshiyaar_club/" target="_blank" rel="noopener noreferrer" className="bg-white/20 p-3 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg" aria-label="Instagram">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            {/* YouTube */}
                            <a href="https://www.youtube.com/@Hoshi-yaar" target="_blank" rel="noopener noreferrer" className="bg-white/20 p-3 rounded-xl hover:bg-white hover:text-red-600 transition-all duration-300 shadow-lg" aria-label="YouTube">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* BOTTOM BAR: No extra top margin, compact */}
                <div className="border-t border-white/20 pt-4 flex flex-col md:flex-row justify-between items-center text-xs sm:text-sm text-white/70">
                    <p className="text-center md:text-left order-2 md:order-1 mt-2 md:mt-0">
                        © {currentYear} HoshiYaar. All rights reserved.
                    </p>
                    <p className="order-1 md:order-2">
                        Designed with ❤️ for Students.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;