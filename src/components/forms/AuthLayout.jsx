import React from 'react';
import { Link } from 'react-router-dom';

const HoshiyaarLogo = "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778743597/img-to-link/bihseec7aigbmau4amnd.png";

const AuthLayout = ({ children, title, linkTo, linkText }) => (
  <div className="min-h-[100dvh] text-slate-900 font-sans flex flex-col relative bg-slate-50 overflow-hidden">
    {/* Dynamic Background Effects */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px]" />
      <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[120px]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-400/20 blur-[100px]" />
    </div>

    <header className="py-4 px-6 lg:px-12 relative z-10 flex-none">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
           <img 
              src={HoshiyaarLogo} 
              alt="HoshiYaar Logo" 
              className="h-8 md:h-10 w-auto object-contain"
           />
        </Link>
        {linkTo && linkText && (
          <Link to={linkTo}>
            <button className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5">
              {linkText}
            </button>
          </Link>
        )}
      </div>
    </header>
    
    <main className="flex-1 flex flex-col px-4 relative z-10 overflow-y-auto pb-8">
      <div className="w-full max-w-md sm:max-w-lg px-2 sm:px-4 mx-auto my-auto pt-2">
        <div 
          className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          {children}
        </div>
      </div>
    </main>
  </div>
);

export default AuthLayout;