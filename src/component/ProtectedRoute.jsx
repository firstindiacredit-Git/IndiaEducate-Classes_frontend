import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on required role
    const loginPath = requiredRole === 'admin' ? '/admin-login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (requiredRole && role !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    const dashboardPath = role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default ProtectedRoute; 