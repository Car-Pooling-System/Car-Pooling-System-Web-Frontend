import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Auth from "./Auth/Auth";
import ProtectedRoute from "./Auth/ProtectedRoute";
import HomePage from './Pages/HomePage';
import DriverRegister from './Pages/DriverRegistration';
import RoleSelection from './Pages/RoleSelection';
import Profile from './Pages/Profile';
import RiderRegistration from './Pages/RiderRegistration';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Auth />}></Route>
          <Route path='/role-selection' element={<RoleSelection />}></Route>
          <Route path="/sso-callback" element={<h1>Redirecting</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reg-driver" element={<DriverRegister />} />
            <Route path="/reg-rider" element={<RiderRegistration />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App