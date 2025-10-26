import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, linkTo, linkText }) => (
  <div className="bg-[#131F24] min-h-screen text-white font-sans flex flex-col">
    <header className="py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl sm:text-2xl font-bold">
          <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </Link>
        <Link to={linkTo}>
          <button className="text-duo-blue font-bold uppercase tracking-wider border-2 border-[#585858] rounded-xl sm:rounded-2xl py-2 px-3 sm:px-4 hover:bg-[#4c4c4c] transition text-sm sm:text-base">
            {linkText}
          </button>
        </Link>
      </div>
    </header>
    <main className="flex-grow flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg px-2 sm:px-4">
        {children}
      </div>
    </main>
  </div>
);

export default AuthLayout;