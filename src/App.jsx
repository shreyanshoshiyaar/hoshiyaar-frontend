import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReviewProvider } from './context/ReviewContext.jsx';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingPage from './components/ui/LoadingPage.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/layout/AdminProtectedRoute.jsx';

// Lazy load components
const Login = lazy(() => import('./components/forms/Login.jsx'));
const Signup = lazy(() => import('./components/forms/Signup.jsx'));
const HomePage = lazy(() => import('./components/layout/HomePage.jsx'));
const OnboardingFlow = lazy(() => import('./components/Learn/selectors/OnboardingFlow.jsx'));
const Learn = lazy(() => import('./components/Learn/pages/Learn.jsx'));
const ProfilePage = lazy(() => import('./components/features/ProfilePage.jsx'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel.jsx'));
const ModuleEntryRedirect = lazy(() => import('./components/Learn/pages/ModuleEntryRedirect.jsx'));
const ConceptPage = lazy(() => import('./components/Learn/pages/ConceptPage.jsx'));
const LessonEntryRedirectByTitle = lazy(() => import('./components/Learn/pages/LessonEntryRedirectByTitle.jsx'));
const McqPage = lazy(() => import('./components/Learn/quiz/McqPage.jsx'));
const FillupsPage = lazy(() => import('./components/Learn/quiz/FillupsPage.jsx'));
const RearrangePage = lazy(() => import('./components/Learn/quiz/RearrangePage.jsx'));
const DescriptivePage = lazy(() => import('./components/Learn/quiz/DescriptivePage.jsx'));
const LessonComplete = lazy(() => import('./components/Learn/pages/LessonComplete.jsx'));
const ReviewRound = lazy(() => import('./components/Learn/quiz/ReviewRound.jsx'));
const RevisionList = lazy(() => import('./components/Learn/quiz/RevisionList.jsx'));
const UploadTest = lazy(() => import('./components/features/UploadTest.jsx'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy.jsx'));
const TermsConditions = lazy(() => import('./components/Legal/TermsConditions.jsx'));
const BlogList = lazy(() => import('./components/Learn/blogs/BlogList.jsx'));
const BlogView = lazy(() => import('./components/Learn/blogs/BlogView.jsx'));
const About = lazy(() => import('./components/layout/About.jsx'));
const Contact = lazy(() => import('./components/layout/Contact.jsx'));
const Disclaimer = lazy(() => import('./components/Legal/Disclaimer.jsx'));
const DeleteAccountPage = lazy(() => import('./components/features/DeleteAccountPage.jsx'));

/**
 * Handles App-wide navigation logic:
 * 1. Restores last visited path on startup.
 * 2. Saves current path to localStorage.
 * 3. Manages Hardware Back Button.
 */
const NavigationController = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = React.useRef(location);

  // Update ref on every location change
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Handle Startup (Restore Path)
  useEffect(() => {
    try {
      const savedPath = localStorage.getItem('hoshiyaar_last_path');
      if (savedPath && savedPath !== '/' && savedPath !== window.location.pathname) {
        setTimeout(() => navigate(savedPath, { replace: true }), 100);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }, []); // Only once on mount

  // Handle Back Button (Native only)
  useEffect(() => {
    let backListener = null;

    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = locationRef.current.pathname;
          // Exit if on home page or can't go back
          if (currentPath === '/' || currentPath === '/login' || !canGoBack) {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        }).then(l => {
          backListener = l;
        });
      }).catch(e => console.warn('Failed to load capacitor app plugin', e));
    }

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, []); // Listener is set once, uses ref for latest path

  // 3. Save current path
  useEffect(() => {
    // Don't save transient pages like login or loading
    const skipSave = ['/login', '/signup', '/loading'].includes(location.pathname);
    if (!skipSave) {
      try {
        localStorage.setItem('hoshiyaar_last_path', location.pathname + location.search);
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
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

                {/* Protected Learning Routes (each tab is a separate URL) */}
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <Learn />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn" 
                  element={
                    <ProtectedRoute>
                      <Learn />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ranks" 
                  element={
                    <ProtectedRoute>
                      <Learn />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/more" 
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

