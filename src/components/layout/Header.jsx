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
        <Link to="/" className="flex items-center gap-2 sm:gap-4">
          <img 
            src={HoshiyaarLogo} 
            alt="HoshiYaar Logo" 
            // UPDATED: Logo sized to fit perfectly in the sleeker header
            // h-10 (40px) on mobile, h-14 (56px) on desktop
            className="h-10 md:h-14 w-auto object-contain transition-all duration-300" 
          />
        </Link>

        {/* BUTTONS SECTION */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button 
                onClick={handleLogout}
                className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-xs sm:text-sm btn-responsive"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-xs sm:text-sm btn-responsive">
                Login / Signup
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;