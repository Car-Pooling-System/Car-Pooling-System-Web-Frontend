import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Auth from "./Auth/Auth";
import ProtectedRoute from "./Auth/ProtectedRoute";
import HomePage from './Pages/HomePage';
import DriverRegister from './Pages/DriverRegistration';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Auth />}></Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/reg-driver" element={<DriverRegister />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App