import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Activity className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // 1. Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Handle Pending Hospital Admins
  const isPending = user.status === 'pending' || user.isApproved === false;
  if (user.role === 'hospital_admin' && isPending) {
    // If they are not already on the pending page, send them there
    if (!location.pathname.includes('/pending-approval')) {
      return <Navigate to="/pending-approval" replace />;
    }
    // If they are on the pending page, they are allowed to see it.
    // Wait, the RoleRoute doesn't protect the pending page. The pending page will be a separate protected route.
  }

  // 3. Not authorized for this specific route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Route them to their correct home
    switch (user.role) {
      case 'super_admin': return <Navigate to="/super-admin" replace />;
      case 'hospital_admin': 
        return isPending ? <Navigate to="/pending-approval" replace /> : <Navigate to="/hospital-admin" replace />;
      case 'patient': return <Navigate to="/patient" replace />;
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'pharmacist': return <Navigate to="/pharmacist" replace />;
      default: return <Navigate to="/staff" replace />;
    }
  }

  // 4. Authorized
  return <Outlet />;
};

export default RoleRoute;
