import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; 
const HoshiyaarLogo = "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778743597/img-to-link/bihseec7aigbmau4amnd.png";

const Header = ({ isHomePage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  return (
    <header className={`
      ${isHomePage ? 'absolute md:sticky' : 'sticky'} 
      top-0 w-full z-50 transition-all duration-300
      ${isHomePage ? 'bg-transparent md:bg-white md:border-b border-duo-gray h-16 md:h-20' : 'bg-transparent md:bg-white md:border-b border-duo-gray h-16 md:h-20'}
      flex items-center
    `}>
      <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center">
        
        {/* LOGO SECTION */}
        <Link to="/" className="flex-shrink-0 z-10 block group">
          <img 
            src={HoshiyaarLogo} 
            alt="HoshiYaar Logo" 
            // h-8 (32px) on mobile, h-10 (40px) on small, h-14 (56px) on desktop
            className="h-8 sm:h-10 md:h-14 w-auto object-contain transition-all duration-300" 
          />
        </Link>

        {/* BUTTONS SECTION */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          
          {/* Contact Us Link */}
          <Link to="/contact" className="flex-shrink-0">
            <button className="whitespace-nowrap bg-duo-blue text-white font-bold uppercase tracking-wider py-1.5 px-2.5 sm:py-2 sm:px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-[9px] sm:text-xs md:text-sm btn-responsive">
              Contact
            </button>
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-shrink-0">
              <button 
                onClick={handleLogout}
                className="whitespace-nowrap bg-duo-blue text-white font-bold uppercase tracking-wider py-1.5 px-2.5 sm:py-2 sm:px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-[9px] sm:text-xs md:text-sm btn-responsive"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/signup" className="flex-shrink-0">
              <button className="whitespace-nowrap bg-duo-blue text-white font-bold uppercase tracking-wider py-1.5 px-2.5 sm:py-2 sm:px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-[9px] sm:text-xs md:text-sm btn-responsive">
                Login / Sign Up
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;