import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import SimpleLoading from '../ui/SimpleLoading.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SimpleLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Guest and trial lesson limits are enforced by the server when a lesson starts (ModuleEntryRedirect)
  return children;
};

export default ProtectedRoute;
