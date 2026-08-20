import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ReviewProvider } from './context/ReviewContext.jsx';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingPage from './components/ui/LoadingPage.jsx';
import UpdatePrompt from './components/ui/UpdatePrompt.jsx';
import MaintenancePrompt from './components/ui/MaintenancePrompt.jsx';
import NotificationPrompt from './components/ui/NotificationPrompt.jsx';
import ExamModePromo from './components/ui/ExamModePromo.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/layout/AdminProtectedRoute.jsx';

// Lazy load components
const UnifiedAuth = lazy(() => import('./components/forms/UnifiedAuth.jsx'));
const ForgotPassword = lazy(() => import('./components/forms/ForgotPassword.jsx'));
const HomePage = lazy(() => import('./components/layout/HomePage.jsx'));
const OnboardingFlow = lazy(() => import('./components/Learn/selectors/OnboardingFlow.jsx'));
const WelcomeScreen = lazy(() => import('./components/Learn/selectors/WelcomeScreen.jsx'));
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
const AndroidForcedInstall = lazy(() => import('./components/layout/AndroidForcedInstall.jsx'));
const InteractiveStory = lazy(() => import('./components/features/InteractiveStory.jsx'));
const ExamPlay = lazy(() => import('./components/features/ExamMode/ExamPlay.jsx'));
const ExamRevision = lazy(() => import('./components/features/ExamMode/ExamRevision.jsx'));
const MidLessonStreakModal = lazy(() => import('./components/Learn/modals/MidLessonStreakModal.jsx'));

import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { fetchAndStoreRegion, captureSignupSource } from './utils/analytics.js';

/**
 * Handles App-wide navigation logic:
 * 1. Restores last visited path on startup.
 * 2. Saves current path to localStorage.
 * 3. Manages Hardware Back Button.
 * 4. Notifies Capgo that the app started successfully.
 */
const NavigationController = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = React.useRef(location);
  const { user } = useAuth();

  // Update ref on every location change
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Handle Startup (Restore Path & Capgo)
  useEffect(() => {
    try {
      const isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
      
      // Notify Capgo OTA Updater that the app booted successfully
      if (isNative) {
        CapacitorUpdater.notifyAppReady().catch(console.error);
      }
      // Track that the app has opened (for Meta Pixel retargeting)
      window.hyTrack?.('app_open');

      const savedPath = localStorage.getItem('hoshiyaar_last_path');
      
      if (savedPath && savedPath !== '/') {
        if (isNative) {
          // On mobile app, always resume where they left off if it's different
          if (savedPath !== window.location.pathname) {
            setTimeout(() => navigate(savedPath, { replace: true }), 100);
          }
        } else {
          // On web, ONLY resume if they explicitly landed on the root page.
          // This prevents overriding direct links to /learn or /blogs.
          if (window.location.pathname === '/') {
            setTimeout(() => navigate(savedPath, { replace: true }), 100);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }, []); // Only once on mount

  // Sync Location when user loads
  useEffect(() => {
    fetchAndStoreRegion(user?._id);
  }, [user?._id]);

  // Handle Back Button (Native only)
  useEffect(() => {
    let backListener = null;

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = locationRef.current.pathname;
          
          // Define base/dashboard routes where back should exit the app
          const dashboardRoutes = ['/', '/login', '/home', '/learn', '/ranks', '/more'];
          
          if (dashboardRoutes.includes(currentPath) || !canGoBack) {
            // Exit app from dashboard routes with a confirmation
            if (window.confirm('Do you want to exit HoshiYaar?')) {
              CapApp.exitApp();
            }
          } else {
            // Check if user is inside a lesson
            const isLesson = currentPath.includes('/learn/module/') && (
              currentPath.includes('/concept') || 
              currentPath.includes('/mcq') || 
              currentPath.includes('/fillups') || 
              currentPath.includes('/rearrange') || 
              currentPath.includes('/descriptive') ||
              currentPath.includes('/review-round')
            );

            if (isLesson) {
              if (window.confirm('Are you sure you want to leave this lesson? Your progress is saved.')) {
                // Navigate to the main dashboard rather than relying on history.back
                // which might take them back to another lesson page or intermediate step
                // Note: navigate is available via closure because NavigationController uses useNavigate
                navigate('/learn', { replace: true });
              }
            } else {
              // Standard behavior for other pages
              window.history.back();
            }
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

  // 3. Save current path and track screen view
  useEffect(() => {
    // Analytics: Map route to clean screen name
    let screenName = 'unknown';
    const path = location.pathname;
    if (path === '/') screenName = 'home';
    else if (path.includes('/login') || path.includes('/signup')) screenName = 'signup';
    else if (path.includes('/onboarding')) screenName = 'onboarding';
    else if (path.includes('/learn/module')) screenName = 'module';
    else if (path.includes('/learn') || path.includes('/home')) screenName = 'home';
    else if (path.includes('/profile')) screenName = 'profile';
    else if (path.includes('/result') || path.includes('/lesson-complete')) screenName = 'result';
    
    if (window.hyTrack) {
        window.hyTrack('screen_view', { screen_name: screenName });
    }

    // Capture acquisition source from URL if present
    captureSignupSource();

    // Check for test variant in URL
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has('variant')) {
        const variant = searchParams.get('variant');
        if (window.clarity) window.clarity('set', 'test_variant', variant);
        if (window.gtag) window.gtag('set', 'user_properties', { test_variant: variant });
    }

    // Don't save transient pages like login or loading
    const skipSave = ['/login', '/signup', '/loading'].includes(location.pathname);
    if (!skipSave) {
      try {
        localStorage.setItem('hoshiyaar_last_path', location.pathname + location.search);
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
    }

    // 4. Save lesson module resume path
    const match = location.pathname.match(/^\/learn\/module\/([^/]+)\/(concept|mcq|fillups|rearrange|descriptive)\/([0-9]+)\/?$/);
    if (match) {
      try {
        const moduleNumber = match[1];
        const index = parseInt(match[3], 10);
        // Save the progress if we're past the first slide, otherwise remove it
        if (index > 0) {
          localStorage.setItem(`resume_lesson_${moduleNumber}`, location.pathname + location.search);
        } else {
          localStorage.removeItem(`resume_lesson_${moduleNumber}`);
        }
      } catch (e) {
        console.warn('Could not save resume path', e);
      }
    } else if (location.pathname === '/lesson-complete') {
      // Clear progress if lesson is complete.
    }
  }, [location]);

  return null;
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="font-sans flex flex-col min-h-screen overflow-x-clip">
      <Header isHomePage={isHomePage} />
      <main className="flex-grow">{children}</main>
      {/* Footer hidden on mobile home page as per user request */}
      <div className={isHomePage ? "hidden md:block" : "block"}>
        <Footer />
      </div>
    </div>
  );
};

import { getApiBase } from './utils/apiBase.js';

// Setup Hoshiyaar Analytics Interceptor
const setupAnalytics = () => {
  if (window._hyTrackSetupDone) return;
  window._hyTrackSetupDone = true;
  
  const originalTrack = window.hyTrack;
  window.hyTrack = function(eventName, params = {}) {
    // 1. Fire original tracking (Meta Pixel / GA)
    if (typeof originalTrack === 'function') {
      originalTrack(eventName, params);
    }
    
    // 2. Sync funnel stage to our backend database for the Admin Panel
    const funnelEvents = [
      'view_welcome_screen', 'click_story_demo', 'skip_story_demo',
      'onboarding_step_completed', 'story_demo_completed', 
      'view_dashboard', 'click_chapter', 'click_module'
    ];
    
    if (funnelEvents.includes(eventName)) {
      try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        if (userObj?._id) {
          fetch(`${getApiBase()}/api/auth/funnel-stage`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userObj._id, stage: eventName })
          }).catch(() => {}); // silent fail for analytics
        }
      } catch(e) {}
    }

    // 3. Sync to Microsoft Clarity (Strictly allowed tags only, no PII)
    if (typeof window.clarity === 'function') {
      const allowedClarityTags = [
        'user_type', 'signup_source', 'class', 'onboarding_status',
        'first_module_status', 'screen_name', 'module_id', 'module_status',
        'error_code', 'notification_id', 'test_variant'
      ];

      // Infer statuses from specific GA4 event names
      if (eventName === 'home_viewed') window.clarity('set', 'screen_name', 'dashboard');
      if (eventName === 'view_welcome_screen') window.clarity('set', 'screen_name', 'welcome_screen');
      if (eventName === 'onboarding_step_completed') window.clarity('set', 'onboarding_status', 'in_progress');
      if (eventName === 'first_module_completed') window.clarity('set', 'first_module_status', 'completed');
      if (eventName === 'level_start') window.clarity('set', 'module_status', 'active');
      if (eventName === 'level_end') window.clarity('set', 'module_status', 'completed');

      // Forward allowed parameters automatically from the event payload
      for (const [key, value] of Object.entries(params)) {
        if (allowedClarityTags.includes(key) && value !== undefined && value !== null) {
           window.clarity("set", key, String(value));
        }
      }
    }
  };
};

// Initialize the interceptor
setupAnalytics();

function App() {
  const isAndroidWebAndNotBot = () => {
    if (import.meta.env.DEV) return false; // Bypass forced install during local development testing
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent);
    const isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    
    return isAndroid && !isBot && !isNative;
  };

  if (isAndroidWebAndNotBot()) {
    return (
      <Suspense fallback={<LoadingPage />}>
        <AndroidForcedInstall />
      </Suspense>
    );
  }

  return (
    <AuthProvider>
      <ReviewProvider>
          <Router>
            <MaintenancePrompt />
            <UpdatePrompt />
            <NotificationPrompt />
            <ExamModePromo />
            <NavigationController />
            <Suspense fallback={<LoadingPage />}>
              <MidLessonStreakModal />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<UnifiedAuth />} />
                <Route path="/signup" element={<UnifiedAuth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/loading" element={<LoadingPage />} />
                <Route path="/story-demo" element={<InteractiveStory />} />
                <Route path="/exam/play" element={
                  <ProtectedRoute>
                    <ExamPlay />
                  </ProtectedRoute>
                } />
                <Route path="/exam/revision" element={
                  <ProtectedRoute>
                    <ExamRevision />
                  </ProtectedRoute>
                } />
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

                {/* Welcome Screen route */}
                <Route 
                  path="/welcome" 
                  element={
                    <ProtectedRoute>
                      <WelcomeScreen />
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
                  path="/exam" 
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
                <Route path="/blogs/:category/:slug" element={<BlogView />} />
                <Route path="/blogs/:id" element={<BlogView />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                {/* Hidden account management route — not linked anywhere in UI */}
                <Route path="/account/remove" element={<DeleteAccountPage />} />
                
                {/* Catch-all redirect for broken links like /refund-policy */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </ReviewProvider>
    </AuthProvider>
  );
}

export default App;

