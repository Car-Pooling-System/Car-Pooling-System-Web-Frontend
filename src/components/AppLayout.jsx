import { NavLink, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Find Rides", to: "/find-rides" },
  { label: "My Rides", to: "/my-rides" },
  { label: "Messages", to: "/messages" },
  { label: "Profile", to: "/profile" },
];

export function AppLayout() {
  const location = useLocation();
  const pageTitle = location.pathname === "/create-ride" ? "Create Ride" : "RideShare";

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav__content">
          <NavLink className="brand" to="/create-ride">
            <div className="brand__icon">R</div>
            <span className="brand__name">RideShare</span>
          </NavLink>

          <nav className="top-nav__links" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) => (isActive ? "top-nav__link top-nav__link--active" : "top-nav__link")}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink className="avatar-pill" to="/profile" aria-label="Open profile">
            {pageTitle.slice(0, 1)}
          </NavLink>
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
