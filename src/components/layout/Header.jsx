import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; 
import HoshiyaarLogo from '../../assets/images/HoshiYaar-logo.jpg';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  return (
    // UPDATED: Header height set to h-16 (mobile) and md:h-20 (desktop) for a sleeker look
    <header className="sticky top-0 bg-white border-b border-duo-gray h-16 md:h-20 flex items-center z-50 transition-all duration-300">
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
                // UPDATED: Adjusted padding (md:py-2.5) for a sharper, less bulky button look on desktop
                className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-xs sm:text-sm btn-responsive"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login">
              {/* UPDATED: Adjusted padding (md:py-2.5) for consistency */}
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