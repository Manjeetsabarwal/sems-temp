import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Login } from './Login';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'student' | 'parent';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, currentUser } = useApp();

  useEffect(() => {
    // Optional: Check if user has required role
    if (isAuthenticated && requiredRole && currentUser?.role !== requiredRole) {
      console.warn(`Access denied: Required role ${requiredRole}, but user has ${currentUser?.role}`);
    }
  }, [isAuthenticated, requiredRole, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Check role if required
  if (requiredRole && currentUser?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Access Denied</p>
          <p className="text-gray-600">
            You need {requiredRole} role to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
