// src/components/FeatureSection.jsx

import React from 'react';

// We remove 'description' from the props and add 'children'
const FeatureSection = ({ title, imgSrc, imageSide = 'right', children }) => {
  const rowDirection = imageSide === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row';
  
  return (
    <section className="py-12 lg:py-24 bg-duo-light-blue">
      <div className={`container mx-auto px-6 flex flex-col ${rowDirection} items-center justify-center gap-12`}>
        <div className="lg:w-1/3 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-duo-blue mb-4">{title}</h2>
          {/* Instead of a <p> tag with a description, we render the children directly */}
          <div className="text-lg text-duo-text">
            {children}
          </div>
        </div>
        <div className="lg:w-1/2">
          <img src={imgSrc} alt={title} className="max-w-xs mx-auto lg:max-w-md" />
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;