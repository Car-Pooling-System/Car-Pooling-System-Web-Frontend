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
