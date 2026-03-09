import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

import HomePage from "./Pages/HomePage.jsx";
import SignInPage from "./Pages/SignInPage.jsx";
import SignUpPage from "./Pages/SignUpPage.jsx";
import ProfilePage from "./Pages/ProfilePage.jsx";
import RiderRides from "./Pages/rider/RiderRide.jsx";
import DriverRides from "./Pages/driver/DriverRides.jsx";
import DriverRegistrationPage from "./Pages/driver/DriverRegistrationPage.jsx";
import MyProfilePage from "./Pages/MyProfilePage.jsx";
import RoleSelection from "./Pages/RoleSelection.jsx";
import RiderEditProfile from "./Pages/rider/RiderEditProfile.jsx";
import DriverEditProfile from "./Pages/driver/DriverEditProfile.jsx";
import SearchRidesPage from "./Pages/SearchRidesPage.jsx";
import CreateRidePage from "./Pages/driver/CreateRidePage.jsx";


// Automatically sets unsafeMetadata.role = "rider" on first sign-in
// Now redirects to role selection if no role is set
function RoleInitializer() {
    const { isSignedIn, user } = useUser();

    useEffect(() => {
        if (!isSignedIn || !user) return;
        // We no longer auto-assign role — user picks it on /role-selection
    }, [isSignedIn, user]);

    return null;
}

export default function App() {
    const { user, isSignedIn } = useUser();
    const role = user?.unsafeMetadata?.role || null;

    // If user is signed in but has no role picked, redirect to selection
    const needsRoleSelection = isSignedIn && !role;

    return (
        <>
            <RoleInitializer />
            <Routes>
                <Route path="/" element={needsRoleSelection ? <Navigate to="/role-selection" replace /> : <HomePage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="/profile" element={<MyProfilePage />} />
                <Route
                    path="/my-rides"
                    element={role === "driver" ? <DriverRides /> : <RiderRides />}
                />
                <Route path="/driver/register" element={<DriverRegistrationPage />} />
                <Route path="/rider/edit-profile" element={<RiderEditProfile />} />
                <Route path="/driver/edit-profile" element={<DriverEditProfile />} />
                <Route path="/driver/create-ride" element={<CreateRidePage />} />
                <Route path="/search" element={<SearchRidesPage />} />
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
