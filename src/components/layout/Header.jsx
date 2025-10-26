import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Import the useAuth hook with .jsx
import { DuolingoLogo } from '../ui/Icons';

const Header = () => {
  const { user, logout } = useAuth(); // Get user and logout function from context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home after logout
  };

  return (
    <header className="sticky top-0 bg-white border-b border-duo-gray h-16 sm:h-20 flex items-center z-50">
      <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 sm:gap-4">
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-duo-blue tracking-tight">HoshiYaar</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            // If user is logged in, show Account and Logout buttons
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button 
                onClick={handleLogout}
                className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 sm:py-3 sm:px-6 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition text-xs sm:text-sm btn-responsive"
              >
                Logout
              </button>
            </div>
          ) : (
            // If user is not logged in, show Login/Signup button
            <Link to="/login">
              <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-4 sm:py-3 sm:px-6 md:px-7 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition text-xs sm:text-sm btn-responsive">
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

