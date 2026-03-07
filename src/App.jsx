import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CreateRidePage } from "./pages/CreateRidePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate replace to="/create-ride" />} />
        <Route path="/create-ride" element={<CreateRidePage />} />
        <Route
          path="/find-rides"
          element={<PlaceholderPage title="Find Rides" description="Ride discovery page will appear here." />}
        />
        <Route
          path="/my-rides"
          element={<PlaceholderPage title="My Rides" description="Your hosted and booked rides will appear here." />}
        />
        <Route
          path="/messages"
          element={<PlaceholderPage title="Messages" description="Conversations with riders and drivers will appear here." />}
        />
        <Route
          path="/profile"
          element={<PlaceholderPage title="Profile" description="Driver and rider profile settings will appear here." />}
        />
      </Route>
      <Route path="*" element={<Navigate replace to="/create-ride" />} />
    </Routes>
  );
}
