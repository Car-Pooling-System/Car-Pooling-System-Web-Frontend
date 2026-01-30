import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';
import Loader from '../components/Loading';

const ProtectedRoute = () => {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return <Loader />
    }

    if (!isSignedIn) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;