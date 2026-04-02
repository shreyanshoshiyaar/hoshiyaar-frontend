// src/components/HomePage.jsx
import React from 'react';
import Hero from '../features/Hero';
// import LanguageScroller from './LanguageScroller'; // Make sure this component exists
import FeatureSection from '../features/FeatureSection';
import AppDownloadSection from '../features/AppDownloadSection';
import ProductSection from '../features/ProductSection';
import FinalCTA from '../features/FinalCTA';
import { features, products } from '../../constants/data'; // Correct path to data.js

const HomePage = () => (
  <>
    <Hero />
    {/* I've uncommented LanguageScroller, assuming you have this component */}
    {/* <LanguageScroller /> */}
    
    
    
    {/* <AppDownloadSection /> */}
    
    {/* Removed product sections */}
    
    <FinalCTA />
  </>
);

export default HomePage;