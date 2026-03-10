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
import RiderRideDetails from "./Pages/rider/RiderRideDetails.jsx";
import DriverRideDetails from "./Pages/driver/DriverRideDetails.jsx";


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
    const isDriver = role === "driver";

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
                    element={isDriver ? <DriverRides /> : <RiderRides />}
                />
                <Route
                    path="/driver/register"
                    element={isDriver ? <Navigate to="/driver/edit-profile" replace /> : <DriverRegistrationPage />}
                />
                <Route
                    path="/rider/edit-profile"
                    element={isDriver ? <Navigate to="/driver/edit-profile" replace /> : <RiderEditProfile />}
                />
                <Route
                    path="/driver/edit-profile"
                    element={isDriver ? <DriverEditProfile /> : <Navigate to="/rider/edit-profile" replace />}
                />
                <Route
                    path="/driver/create-ride"
                    element={isDriver ? <CreateRidePage /> : <Navigate to="/my-rides" replace />}
                />
                <Route path="/search" element={<SearchRidesPage />} />
                <Route path="/my-rides/:rideId" element={role === "driver" ? <DriverRideDetails /> : <RiderRideDetails />} />
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
