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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Guests can play 5 lessons in total; the gate asks them to verify for the rest
  const lessonId = moduleNumber || moduleId;
  if (user.isGuest && lessonId) {
    return <GuestLessonGate userId={user._id} moduleId={lessonId}>{children}</GuestLessonGate>;
  }

  return children;
};

export default ProtectedRoute;
