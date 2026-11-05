import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import SimpleLoading from '../ui/SimpleLoading.jsx';
import GuestLessonGate from './GuestLessonGate.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { moduleNumber, moduleId } = useParams();

  if (loading) {
    return <SimpleLoading />;
  }

  // Preview override: ?guestPaywall=true allows testing the guest modal on any lesson
  const isGuestTest = typeof window !== 'undefined' && window.location.search.includes('guestPaywall=true');

  if (!user && !isGuestTest) {
    return <Navigate to="/login" replace />;
  }

  // Guests can play 5 lessons in total; the gate asks them to verify for the rest
  const lessonId = moduleNumber || moduleId;
  if (((user && user.isGuest) || isGuestTest) && lessonId) {
    return <GuestLessonGate userId={user?._id || 'guest_demo'} moduleId={lessonId}>{children}</GuestLessonGate>;
  }

  return children;
};

export default ProtectedRoute;
