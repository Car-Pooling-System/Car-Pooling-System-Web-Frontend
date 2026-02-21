import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import HomePage from "./pages/HomePage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import DriverDashboardPage from "./pages/DriverDashboardPage.jsx";

// Automatically sets unsafeMetadata.role = "rider" on first sign-in
function RoleInitializer() {
    const { isSignedIn, user } = useUser();

    useEffect(() => {
        if (!isSignedIn || !user) return;
        if (!user.unsafeMetadata?.role) {
            user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: "rider" } });
        }
    }, [isSignedIn, user]);

    return null;
}

/**
 * Smart home: renders the Driver Dashboard when signed in as a driver,
 * otherwise renders the regular landing page.
 */
function SmartHomePage() {
    const { isSignedIn, isLoaded, user } = useUser();
    if (!isLoaded) return null; // avoid flash
    const isDriver = isSignedIn && user?.unsafeMetadata?.role === "driver";
    return isDriver ? <DriverDashboardPage /> : <HomePage />;
}

export default function App() {
    return (
        <>
            <RoleInitializer />
            <Routes>
                <Route path="/" element={<SmartHomePage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
