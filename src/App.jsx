import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Auth from "./Auth/Auth";
import ProtectedRoute from "./Auth/ProtectedRoute";

import HomePage from './Pages/HomePage';
import DriverRegister from './Pages/DriverRegistration';
import RiderRegistration from './Pages/RiderRegistration';
import RoleSelection from './Pages/RoleSelection';
import Profile from './Pages/Profile';

// 🔥 NEW PAGES
import SearchRides from './Pages/SearchRides';
import RideDetails from './Pages/RideDetails';
import CreateRide from './components/driver/CreateRide';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/" element={<Auth />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/sso-callback" element={<h1>Redirecting...</h1>} />

        {/* ---------- PROTECTED ---------- */}
        <Route element={<ProtectedRoute />}>
          {/* Common */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />

          {/* Registration */}
          <Route path="/reg-driver" element={<DriverRegister />} />
          <Route path="/reg-rider" element={<RiderRegistration />} />

          {/* Rider */}
          <Route path="/rides/search" element={<SearchRides />} />
          <Route path="/rides/:rideId" element={<RideDetails />} />

          {/* Driver */}
          <Route path="/driver/create-ride" element={<CreateRide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;