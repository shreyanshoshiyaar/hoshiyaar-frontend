import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReviewProvider } from './context/ReviewContext.jsx';
import { StarsProvider } from './context/StarsContext.jsx';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingPage from './components/ui/LoadingPage.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/layout/AdminProtectedRoute.jsx';

// Lazy load components
const HomePage = lazy(() => import('./components/layout/HomePage'));
const Login = lazy(() => import('./components/forms/Login'));
const Signup = lazy(() => import('./components/forms/Signup'));
const Learn = lazy(() => import('./components/Learn/pages/Learn.jsx'));
const ReviewRound = lazy(() => import('./components/Learn/quiz/ReviewRound.jsx'));
const RevisionList = lazy(() => import('./components/Learn/quiz/RevisionList.jsx'));
const McqPage = lazy(() => import('./components/Learn/quiz/McqPage.jsx'));
const FillupsPage = lazy(() => import('./components/Learn/quiz/FillupsPage.jsx'));
const RearrangePage = lazy(() => import('./components/Learn/quiz/RearrangePage.jsx'));
const DescriptivePage = lazy(() => import('./components/Learn/quiz/DescriptivePage.jsx'));
const ModuleEntryRedirect = lazy(() => import('./components/Learn/pages/ModuleEntryRedirect.jsx'));
const LessonEntryRedirectByTitle = lazy(() => import('./components/Learn/pages/LessonEntryRedirectByTitle.jsx'));
const LessonComplete = lazy(() => import('./components/Learn/pages/LessonComplete.jsx'));
const ConceptPage = lazy(() => import('./components/Learn/pages/ConceptPage.jsx'));
const UploadTest = lazy(() => import('./components/features/UploadTest.jsx'));
const ProfilePage = lazy(() => import('./components/features/ProfilePage.jsx'));
const OnboardingFlow = lazy(() => import('./components/Learn/selectors/OnboardingFlow.jsx'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel.jsx'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy.jsx'));
const TermsConditions = lazy(() => import('./components/Legal/TermsConditions.jsx'));
const BlogList = lazy(() => import('./components/Learn/blogs/BlogList.jsx'));
const BlogView = lazy(() => import('./components/Learn/blogs/BlogView.jsx'));
const About = lazy(() => import('./components/layout/About.jsx'));
const Contact = lazy(() => import('./components/layout/Contact.jsx'));
const Disclaimer = lazy(() => import('./components/Legal/Disclaimer.jsx'));

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
      <StarsProvider>
        <ReviewProvider>
          <Router>
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
                <Route path="/lesson-complete" element={<LessonComplete />} />
                <Route path="/review-round" element={<ReviewRound />} />
                <Route path="/revision" element={<RevisionList />} />
                  
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
              </Routes>
            </Suspense>
          </Router>
        </ReviewProvider>
      </StarsProvider>
    </AuthProvider>
  );
}

export default App;

