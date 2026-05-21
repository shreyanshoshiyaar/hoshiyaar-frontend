import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReviewProvider } from './context/ReviewContext.jsx';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingPage from './components/ui/LoadingPage.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/layout/AdminProtectedRoute.jsx';

// Lazy load components
// ... (existing lazy imports)

/**
 * Handles App-wide navigation logic:
 * 1. Restores last visited path on startup.
 * 2. Saves current path to localStorage.
 * 3. Manages Hardware Back Button.
 */
const NavigationController = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Startup and Back Button
  useEffect(() => {
    // 1. Restore Path
    const savedPath = localStorage.getItem('hoshiyaar_last_path');
    if (savedPath && savedPath !== '/' && savedPath !== window.location.pathname) {
      // Small delay to ensure app is ready
      setTimeout(() => navigate(savedPath, { replace: true }), 100);
    }

    // 2. Back Button Listener
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/' || !canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, []);

  // 3. Save current path
  useEffect(() => {
    // Don't save transient pages like login or loading
    const skipSave = ['/login', '/signup', '/loading'].includes(location.pathname);
    if (!skipSave) {
      localStorage.setItem('hoshiyaar_last_path', location.pathname + location.search);
    }
  }, [location]);

  return null;
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="font-sans flex flex-col min-h-screen overflow-x-hidden">
      <Header isHomePage={isHomePage} />
      <main className="flex-grow">{children}</main>
      {/* Footer hidden on mobile home page as per user request */}
      <div className={isHomePage ? "hidden md:block" : "block"}>
        <Footer />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ReviewProvider>
          <Router>
            <NavigationController />
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/loading" element={<LoadingPage />} />

                {/* Home Page Route */}
                <Route path="/" element={
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                } />

                {/* Onboarding route */}
                <Route 
                  path="/onboard" 
                  element={
                    <ProtectedRoute>
                      <OnboardingFlow />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Learning Route */}
                <Route 
                  path="/learn" 
                  element={
                    <ProtectedRoute>
                      <Learn />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <AdminProtectedRoute>
                      <AdminPanel />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber" 
                  element={
                    <ProtectedRoute>
                      <ModuleEntryRedirect />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber/concept/:index" 
                  element={
                    <ProtectedRoute>
                      <ConceptPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber/lesson/:title" 
                  element={
                    <ProtectedRoute>
                      <LessonEntryRedirectByTitle />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber/mcq/:index" 
                  element={
                    <ProtectedRoute>
                      <McqPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber/fillups/:index" 
                  element={
                    <ProtectedRoute>
                      <FillupsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber/rearrange/:index" 
                  element={
                    <ProtectedRoute>
                      <RearrangePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/module/:moduleNumber/descriptive/:index" 
                  element={
                    <ProtectedRoute>
                      <DescriptivePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/lesson-complete" 
                  element={
                    <ProtectedRoute>
                      <LessonComplete />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/review-round" 
                  element={
                    <ProtectedRoute>
                      <ReviewRound />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/revision" 
                  element={
                    <ProtectedRoute>
                      <RevisionList />
                    </ProtectedRoute>
                  } 
                />
                  
                <Route 
                  path="/admin/upload-test" 
                  element={
                    <AdminProtectedRoute>
                      <UploadTest />
                    </AdminProtectedRoute>
                  } 
                />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/blogs" element={<BlogList />} />
                <Route path="/blogs/:id" element={<BlogView />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                {/* Hidden account management route — not linked anywhere in UI */}
                <Route path="/account/remove" element={<DeleteAccountPage />} />
              </Routes>
            </Suspense>
          </Router>
        </ReviewProvider>
    </AuthProvider>
  );
}

export default App;

