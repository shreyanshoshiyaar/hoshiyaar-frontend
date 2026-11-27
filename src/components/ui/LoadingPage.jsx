import React from 'react';
import HyLoader from './HyLoader.jsx';

// App-wide fallback while a page's code downloads: the same shared loader
const LoadingPage = () => <HyLoader text="Loading" />;

export default LoadingPage;
