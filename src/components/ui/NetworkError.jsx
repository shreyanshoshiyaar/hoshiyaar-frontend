import React from 'react';

const NetworkError = ({
  title = "Connection Lost",
  message = "We couldn't load the content right now. Please check your internet connection and try again.",
  onRetry = () => window.location.reload(),
  compact = false
}) => {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center w-full">
        <div className="w-12 h-12 mb-3 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <p className="text-gray-600 text-sm mb-4 max-w-[250px]">{message}</p>
        <button 
            onClick={onRetry}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm shadow-sm"
        >
            Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center mt-10 w-full relative z-10">
      <div className="w-20 h-20 mb-6 bg-red-100/80 rounded-full flex items-center justify-center shadow-inner">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-3 drop-shadow-sm">{title}</h2>
      <p className="text-gray-500 text-sm md:text-base font-medium mb-8 max-w-sm">{message}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-2 text-sm shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry Connection
      </button>
    </div>
  );
};

export default NetworkError;
