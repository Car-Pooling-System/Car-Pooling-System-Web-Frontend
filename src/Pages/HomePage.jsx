import React, { useRef, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useClerk,
  useUser,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

import {
  Car,
  Calendar,
  User,
  MapPin,
  Wallet,
  ShieldCheck,
  LogOut,
  UserCircle,
  ChevronDown,
} from "lucide-react";

import heroBg from "../assets/hero-bg.png"; // ✅ Vite-safe import

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 13.0827,
  lng: 80.2707,
};

export default function HomePage() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const originRef = useRef();
  const destinationRef = useRef();

  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const calculateRoute = async () => {
    if (!originRef.current?.value || !destinationRef.current?.value || !date) {
      alert("Please select origin, destination and date");
      return;
    }

    const service = new window.google.maps.DirectionsService();
    const results = await service.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    setDirections(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  };

  const clearRoute = () => {
    setDirections(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destinationRef.current.value = "";
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
    >
      <div className="min-h-screen font-[var(--font-family)] bg-[var(--color-bg)] text-[var(--color-text-primary)]">

        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="w-7 h-7 text-[var(--color-primary)]" />
              <h2 className="text-xl font-bold">RideShare</h2>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex gap-6 text-sm">
                {["Search", "Publish", "Safety", "Help"].map((item) => (
                  <a
                    key={item}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item === "Publish") navigate("/driver/create-ride");
                      if (item === "Search") navigate("/rides/search");
                    }}
                    href="#"
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition"
                  >
                    {item}
                  </a>
                ))}
              </nav>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white font-semibold">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 rounded-md bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold">
                    Sign up
                  </button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <div className="relative">
                  {/* Avatar Button */}
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="flex items-center gap-2 hover:opacity-80 transition"
                  >
                    <img
                      src={user?.imageUrl}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)]"
                    />
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/profile');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                      >
                        <UserCircle className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={async () => {
                          setShowDropdown(false);
                          await signOut();
                          // User stays on home page after logout
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </SignedIn>
            </div>
          </div>
        </header>

        {/* ================= HERO ================= */}
        <section className="px-6 py-12">
          <div
            className="max-w-[1200px] mx-auto rounded-xl overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.6)), url(${heroBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="min-h-[520px] flex flex-col items-center justify-center text-center px-6 gap-6">
              <h1 className="text-white text-4xl md:text-6xl font-extrabold">
                Your pick of rides at low prices
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Find the perfect ride from thousands of destinations across the country.
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg flex flex-col md:flex-row items-center gap-2 p-2">

                <Autocomplete>
                  <input
                    ref={originRef}
                    placeholder="Leaving from..."
                    className="flex-1 px-4 py-3 outline-none text-sm"
                  />
                </Autocomplete>

                <Autocomplete>
                  <input
                    ref={destinationRef}
                    placeholder="Going to..."
                    className="flex-1 px-4 py-3 outline-none text-sm"
                  />
                </Autocomplete>

                <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  <Calendar className="w-4 h-4" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="outline-none bg-transparent cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 px-4 py-3 text-sm">
                  <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="outline-none bg-transparent cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "passenger" : "passengers"}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    calculateRoute();
                    // Optionally navigate to search results or just show them on map
                    // navigate("/rides/search"); 
                  }}
                  className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ROUTE INFO ================= */}
        {distance && (
          <section className="py-6 text-center">
            <p className="text-lg">
              📏 <b>{distance}</b> &nbsp; ⏱ <b>{duration}</b>
            </p>
            <button
              onClick={clearRoute}
              className="mt-4 px-6 py-2 rounded-md bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold"
            >
              Clear Route
            </button>
          </section>
        )}

        {/* ================= MAP ================= */}
        <section className="py-12 px-4">
          <div className="max-w-[1200px] mx-auto rounded-xl overflow-hidden shadow-md">
            <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </div>
        </section>

        {/* ================= WHY US ================= */}
        <section className="py-16">
          <h2 className="text-center text-2xl font-bold mb-10">
            Why travel with us?
          </h2>

          <div className="max-w-[1200px] mx-auto grid md:grid-cols-3 gap-6 px-6">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <MapPin className="w-10 h-10 mx-auto text-[var(--color-primary)] mb-4" />
              <h3 className="font-semibold mb-2">Travel everywhere</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Access thousands of routes and destinations, even those not covered by trains or buses.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Wallet className="w-10 h-10 mx-auto text-[var(--color-primary)] mb-4" />
              <h3 className="font-semibold mb-2">Prices like nowhere</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Save money on every trip. Carpooling is the most affordable way to travel long distances.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto text-[var(--color-primary)] mb-4" />
              <h3 className="font-semibold mb-2">Ride with confidence</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                We verify all our members and provide 24/7 support for a safe journey.
              </p>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="px-6 py-12">
          <div className="max-w-[1200px] mx-auto bg-[var(--color-primary)] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between text-white">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Driving somewhere soon?
              </h3>
              <p className="text-white/90">
                Share your ride and save on travel costs! It only takes a minute.
              </p>
            </div>

            <button
              onClick={() => navigate("/driver/create-ride")}
              className="mt-6 md:mt-0 bg-white text-[var(--color-primary)] px-6 py-3 rounded-lg font-semibold"
            >
              + Publish a ride
            </button>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t py-12 text-sm">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
            {[
              { title: "Company", items: ["About us", "Press", "Careers"] },
              { title: "Community", items: ["Safety", "Trust & Quality", "Reviews"] },
              { title: "Support", items: ["Help Center", "Contact us", "Refund policy"] },
              { title: "Legal", items: ["Terms & Conditions", "Privacy Policy", "Cookies"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-3">{col.title}</h4>
                <ul className="space-y-2 text-[var(--color-text-secondary)]">
                  {col.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-[var(--color-text-muted)]">
            © 2024 RideShare. All rights reserved.
          </p>
        </footer>
      </div>
    </LoadScript>
  );
}
