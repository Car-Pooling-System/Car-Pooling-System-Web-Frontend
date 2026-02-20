import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Auth from "./Auth/Auth";
import ProtectedRoute from "./Auth/ProtectedRoute";

import HomePage from './Pages/HomePage';
import RoleSelection from './Pages/RoleSelection';

// 🔥 DRIVER PAGES
import DriverRegister from './Pages/driver/DriverRegistration';
import CreateRide from './Pages/driver/CreateRide';
import EditRide from './Pages/driver/EditRide';
import DriverRides from './Pages/driver/DriverRides';
import DriverRideDetails from './Pages/driver/DriverRideDetails';
import Profile from './Pages/driver/Profile';

// 🔥 RIDER PAGES
import RiderRegistration from './Pages/rider/RiderRegistration';
import SearchRides from './Pages/rider/SearchRides';
import RideDetails from './Pages/rider/RideDetails';
import RiderRideDetails from './Pages/rider/RiderRideDetails';
import RiderRides from './Pages/rider/RiderRides';
import DemandPredictionPage from './Pages/DemandPredictionPage';

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
          <Route path="/demand-prediction" element={<DemandPredictionPage />} />

          {/* Registration */}
          <Route path="/reg-driver" element={<DriverRegister />} />
          <Route path="/reg-rider" element={<RiderRegistration />} />

          {/* Rider */}
          <Route path="/rides/search" element={<SearchRides />} />
          <Route path="/rides/:rideId/details" element={<RiderRideDetails />} />
          <Route path="/rides/:rideId" element={<RideDetails />} />
          <Route path="/rider/rides" element={<RiderRides />} />

          {/* Driver */}
          <Route path="/driver/create-ride" element={<CreateRide />} />
          <Route path="/driver/rides" element={<DriverRides />} />
          <Route path="/driver/rides/:rideId" element={<DriverRideDetails />} />
          <Route path="/driver/rides/:rideId/edit" element={<EditRide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;