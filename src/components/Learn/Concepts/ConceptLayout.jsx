import React from 'react';

const ConceptLayout = ({ children, footer, onQuit }) => {
  // Back/exit modal removed: allow normal browser navigation

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="border-4 border-blue-200 rounded-2xl shadow-xl p-6 bg-white">
          <div className="pb-6">
            {children}
          </div>
          <div className="pt-4 border-t">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptLayout;


