import React from 'react';
import { Link } from 'react-router-dom';

const FooterLogo = "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778743597/img-to-link/bihseec7aigbmau4amnd.png";

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 text-[#1e293b] w-full mt-auto">
            <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                    
                    {/* COLUMN 1: BRANDING */}
                    <div className="flex flex-col space-y-4 lg:max-w-xs">
                        <Link to="/">
                            <img
                                src={FooterLogo}
                                alt="HoshiYaar Logo"
                                className="h-16 w-auto object-contain mb-2"
                            />
                        </Link>
                        <p className="text-[#475569] text-[14px] font-medium leading-relaxed">
                            HoshiYaar makes science learning engaging, effective and exam-ready for Class 6-8 students.
                        </p>
                        
                        <div className="flex gap-3 pt-2">
                            {/* Instagram */}
                            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white hover:scale-110 transition-transform">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                            {/* YouTube */}
                            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-[#ef4444] text-white hover:scale-110 transition-transform">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            </a>
                            {/* Facebook */}
                            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1877f2] text-white hover:scale-110 transition-transform">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                            </a>
                            {/* Telegram */}
                            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-[#229ED9] text-white hover:scale-110 transition-transform">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.947 3.336L2.345 10.51c-1.317.528-1.31 1.261-.242 1.588l4.78 1.492 11.082-6.985c.523-.316 1.002-.146.598.213L9.589 14.92l-.337 4.793c.493 0 .71-.225.986-.492l2.368-2.302 4.931 3.641c.908.5 1.564.242 1.792-.843l3.242-15.244c.334-1.328-.49-1.93-1.624-1.137z"/></svg>
                            </a>
                        </div>

                    </div>

                    <div className="flex flex-wrap gap-16 lg:gap-24 mt-8 lg:mt-0">
                        {/* COLUMN 2: CLASSES */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="font-extrabold text-[13px] tracking-wider text-[#1e3a8a]">CLASSES</h3>
                            <ul className="space-y-3 text-[14px] text-[#475569] font-medium">
                                <li><Link to="/signup" className="hover:text-[#1e3a8a] transition-colors">Class 6</Link></li>
                                <li><Link to="/signup" className="hover:text-[#1e3a8a] transition-colors">Class 7</Link></li>
                                <li><Link to="/signup" className="hover:text-[#1e3a8a] transition-colors">Class 8</Link></li>
                            </ul>
                        </div>

                        {/* COLUMN 3: SUPPORT & BLOGS */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="font-extrabold text-[13px] tracking-wider text-[#1e3a8a]">SUPPORT</h3>
                            <ul className="space-y-3 text-[14px] text-[#475569] font-medium">
                                <li><Link to="/help" className="hover:text-[#1e3a8a] transition-colors">Help Center</Link></li>
                                <li><Link to="/contact" className="hover:text-[#1e3a8a] transition-colors">Contact Us</Link></li>
                                <li><Link to="/privacy" className="hover:text-[#1e3a8a] transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-[#1e3a8a] transition-colors">Terms & Conditions</Link></li>
                                <li><Link to="/blogs" className="hover:text-[#1e3a8a] transition-colors">Blogs</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* COLUMN 4: NEWSLETTER & APP LINK */}
                    <div className="flex flex-col space-y-4 lg:max-w-xs mt-8 lg:mt-0">
                        
                        {/* Play Store Link */}
                        <div className="pb-1">
                            <a 
                                href="https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block hover:scale-105 active:scale-95 transition-transform"
                                title="Get it on Google Play"
                            >
                                <img 
                                    src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1782664047/img-to-link/mgc5mwvdgxzf0o4w2ikl.webp" 
                                    alt="Get it on Google Play" 
                                    className="h-10 sm:h-11 w-auto object-contain"
                                />
                            </a>
                        </div>

                        <h3 className="font-extrabold text-[13px] tracking-wider text-[#1e3a8a]">NEWSLETTER</h3>
                        <p className="text-[#475569] text-[14px] font-medium">
                            Get tips, updates and new episodes straight to your inbox.
                        </p>
                        <form className="flex flex-col gap-2 mt-2" onSubmit={(e) => e.preventDefault()}>
                            <div className="flex">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="flex-1 px-4 py-2.5 rounded-l-lg border border-gray-300 focus:outline-none focus:border-[#1e3a8a] text-[14px]"
                                />
                                <button type="submit" className="bg-[#facc15] hover:bg-[#eab308] text-black font-bold px-6 py-2.5 rounded-r-lg shadow-sm transition-colors text-[14px]">
                                    Subscribe
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* BOTTOM BAR */}
                <div className="mt-16 text-center text-[#64748b] text-[13px] font-medium">
                    © 2025 Creative Garage. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;