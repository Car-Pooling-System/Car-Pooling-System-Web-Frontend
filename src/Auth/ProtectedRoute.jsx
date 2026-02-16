import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from '../components/Loading';

const ProtectedRoute = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const location = useLocation();

    if (!isLoaded) {
        return <Loader />
    }

    if (!isSignedIn) {
        return <Navigate to="/" replace />;
    }

    // Check if user has a role set in unsafeMetadata
    const userRole = user?.unsafeMetadata?.role;

    // Allow access to /role-selection regardless of role
    if (!userRole && location.pathname !== '/role-selection') {
        return <Navigate to="/role-selection" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;