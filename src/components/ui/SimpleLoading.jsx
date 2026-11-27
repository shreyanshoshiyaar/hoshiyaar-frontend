import React from 'react';
import HyLoader from './HyLoader.jsx';

// Loading screen for lessons and pages: the shared CSS loader (rolling cube, progress, Go back / Contact us)
export default function SimpleLoading({ text = 'Loading adventure' }) {
  return <HyLoader text={text} />;
}
