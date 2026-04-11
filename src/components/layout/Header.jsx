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

        {/* BUTTONS SECTION - HIDDEN IN GUEST MODE */}
        <div className="flex items-center gap-4">
          {/* Auth buttons removed for Guest Mode */}
        </div>
      </div>
    </header>
  );
};

export default Header;