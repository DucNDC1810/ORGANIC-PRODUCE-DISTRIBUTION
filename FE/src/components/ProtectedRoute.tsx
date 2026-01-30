import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Roles allowed to access this route
  redirectTo?: string; // Where to redirect if not authorized
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    toast.error('Vui lòng đăng nhập để tiếp tục.');
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      toast.error('Bạn không có quyền truy cập trang này.');
      // Redirect based on user role
      const roleRedirects: { [key: string]: string } = {
        customer: '/',
        farmer: '/farmer/dashboard',
        admin: '/admin',
        manager: '/manager',
      };
      return <Navigate to={roleRedirects[user.role] || '/'} replace />;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

// Higher-order component version for easier use
export const withProtectedRoute = (
  Component: React.ComponentType,
  allowedRoles?: string[]
) => {
  return (props: any) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific route guards for different roles
export const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['customer']}>{children}</ProtectedRoute>
);

export const FarmerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['farmer']}>{children}</ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['manager']}>{children}</ProtectedRoute>
);

// Route that allows multiple roles
export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['farmer', 'admin']}>{children}</ProtectedRoute>
);
