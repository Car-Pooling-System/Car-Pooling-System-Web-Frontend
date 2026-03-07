<<<<<<< HEAD
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RiderRides from './Pages/rider/RiderRides';

// Mock components for other routes shown in the screenshot
const Home = () => <div className="p-8">Home Page (Redirecting to My Rides for now)</div>;
const SearchRides = () => <div className="p-8">Search Rides Page</div>;
const Profile = () => <div className="p-8">Profile Page</div>;

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-slate-50">
                <Routes>
                    <Route path="/" element={<Navigate to="/my-rides" replace />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/search" element={<SearchRides />} />
                    <Route path="/my-rides" element={<RiderRides />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<div className="p-8">404 - Page Not Found</div>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
=======
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import HomePage from "./pages/HomePage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RiderRides from "./pages/rider/RiderRides.jsx";
import DriverRides from "./pages/driver/DriverRides.jsx";
import DriverRegistrationPage from "./pages/driver/DriverRegistrationPage.jsx";
import MyProfilePage from "./pages/MyProfilePage.jsx";
import RoleSelection from "./pages/RoleSelection.jsx";
import RiderEditProfile from "./pages/rider/RiderEditProfile.jsx";
import DriverEditProfile from "./pages/driver/DriverEditProfile.jsx";
import SearchRidesPage from "./pages/SearchRidesPage.jsx";
import CreateRidePage from "./pages/driver/CreateRidePage.jsx";

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
>>>>>>> feat/myrides
