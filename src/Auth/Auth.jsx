import React, { useEffect } from "react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import Loader from "../components/Loading";

const Auth = () => {
    const url = import.meta.env.VITE_BACKEND_URL;

    // ✅ Call hooks
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { user } = useUser();

    // Optional backend token fetch
    useEffect(() => {
        if (!isSignedIn) return;

        const fetchToken = async () => {
            const token = await getToken();

            await fetch(`${url}/print-token`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        };

        fetchToken();
    }, [isSignedIn, getToken, url]);

    // ⏳ Wait for Clerk
    if (!isLoaded) {
        return <Loader isDarkMode={true} />;
    }

    // ✅ Role-based redirect
    if (isSignedIn && user) {
        const role = user.unsafeMetadata?.role;

        if (!role) {
            return <Navigate to="/role-selection" replace />;
        }

        return <Navigate to="/home" replace />;
    }

    // ✅ CORRECT Clerk SignIn (NO routing/path props)
    return (
        <div className="min-h-screen flex items-center justify-center">
            <SignIn
                // redirectUrl="/sso-callback"
                afterSignInUrl="/home"
            />
        </div>
    );
};

export default Auth;
