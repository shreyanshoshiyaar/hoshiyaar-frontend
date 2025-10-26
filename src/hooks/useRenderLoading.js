import { useState, useEffect } from 'react';

const useRenderLoading = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingReason, setLoadingReason] = useState('initial');

  useEffect(() => {
    // Check if this is likely a Render free instance spin-up
    const checkRenderLoading = () => {
      const startTime = Date.now();
      
      // If the page takes more than 5 seconds to load, likely Render spin-up
      const timer = setTimeout(() => {
        if (Date.now() - startTime > 5000) {
          setLoadingReason('render-spinup');
        }
      }, 5000);

      // Check for slow network or server response
      const checkSlowResponse = () => {
        if (performance.timing) {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          if (loadTime > 10000) { // More than 10 seconds
            setLoadingReason('render-spinup');
          }
        }
      };

      // Listen for when the page is fully loaded
      if (document.readyState === 'complete') {
        checkSlowResponse();
        clearTimeout(timer);
        setIsLoading(false);
      } else {
        window.addEventListener('load', () => {
          checkSlowResponse();
          clearTimeout(timer);
          setIsLoading(false);
        });
      }
    };

    checkRenderLoading();

    // Fallback: hide loading after 15 seconds regardless
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  return { isLoading, loadingReason };
};

export default useRenderLoading;
