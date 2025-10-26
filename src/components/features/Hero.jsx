import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import heroImage from '../../assets/images/heroChar.png';

const Hero = () => {
  const { user } = useAuth() || {};
  const isLoggedIn = Boolean(user);

  return (
  <section className="py-8 sm:py-12 lg:py-16 xl:py-24">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-5 lg:gap-6 xl:gap-8">
      
      {/* Character Image - Above on small, Left on large */}
      <div className="flex justify-center lg:justify-center order-1 lg:order-1 lg:flex-1">
        <img
          src={heroImage}
          alt="Learn a language illustration"
          className="w-full max-w-[170px] sm:max-w-[200px] md:max-w-[210px] lg:max-w-[250px] xl:max-w-[300px] h-auto"
        />
      </div>

      {/* Text and Buttons - Below on small, Right on large */}
      <div className="flex-1 text-center lg:text-left order-2 lg:order-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-duo-text mb-4 sm:mb-6 text-overflow-fix leading-tight">
          Learn anything, anytime, anywhere — your pace, your way.
        </h1>
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
          {isLoggedIn ? (
            <Link to="/learn" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-1.5 px-4 sm:py-2 sm:px-6 md:px-8 lg:px-10 rounded-md sm:rounded-lg border-b-2 border-duo-blue-dark hover:bg-blue-500 transition btn-responsive text-xs sm:text-sm">
                Back to Study
              </button>
            </Link>
          ) : (
            <Link to="/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-duo-blue text-white font-bold uppercase tracking-wider py-1.5 px-4 sm:py-2 sm:px-6 md:px-8 lg:px-10 rounded-md sm:rounded-lg border-b-2 border-duo-blue-dark hover:bg-blue-500 transition btn-responsive text-xs sm:text-sm">
                Get Started
              </button>
            </Link>
          )}
        </div>
      </div>

    </div>
  </section>
  );
};

export default Hero;
