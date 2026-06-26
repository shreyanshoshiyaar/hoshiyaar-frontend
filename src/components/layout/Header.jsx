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
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button 
                onClick={handleLogout}
                className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all !text-[11px] sm:!text-xs lg:!text-sm btn-responsive"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/signup">
              <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 md:py-2.5 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all !text-[11px] sm:!text-xs lg:!text-sm btn-responsive whitespace-nowrap">
                Login / Sign Up
              </button>
            </Link>
          )}

          {/* WhatsApp Support Link */}
          <a 
            href="https://wa.me/917021970672?text=Hey%20I%20need%20help" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-white bg-[#25D366] hover:bg-[#128C7E] h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] lg:h-[56px] lg:w-[56px] rounded-xl sm:rounded-2xl border-b-4 border-[#1B9B4B] shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Chat with us on WhatsApp"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;