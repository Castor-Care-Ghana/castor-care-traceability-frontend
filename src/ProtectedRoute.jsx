import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './components/dashboard/contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, getUserRole, loading } = useAuth();

  if (loading) return null; // or <Spinner />

  const userRole = getUserRole()?.toLowerCase();
  const isAllowed = isAuthenticated() && (!allowedRoles || allowedRoles.includes(userRole));

  return isAllowed ? children : <Navigate to="/signin" />;
};

export default ProtectedRoute;
