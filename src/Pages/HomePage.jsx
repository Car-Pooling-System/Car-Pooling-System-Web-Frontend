import React, { useRef, useState, useEffect } from "react";
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
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

import {
  Car,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Wallet,
  ShieldCheck,
  LogOut,
  UserCircle,
  ChevronDown,
  Plus,
  Minus,
  Search,
  Clock,
} from "lucide-react";

import heroBg from "../assets/hero-bg.png";
import carSharing from "../assets/Car-sharing-img.jpg";

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "1rem",
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
  const originAutoRef = useRef(null);
  const destinationAutoRef = useRef(null);

  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [passengers, setPassengers] = useState(1);

  // Use a wrapper ref to handle clicks outside the calendar
  const calendarWrapperRef = useRef(null);

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
    if (originRef.current) originRef.current.value = "";
    if (destinationRef.current) destinationRef.current.value = "";
  };

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarWrapperRef.current && !calendarWrapperRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
    >
      <div className="min-h-screen font-[var(--font-family)] bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased selection:bg-[var(--color-primary-muted)] selection:text-[var(--color-primary)]">

        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="bg-[var(--color-primary)] p-2 rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">RideShare</h2>
            </div>

            {/* Desktop Nav & Actions */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex gap-8 text-sm font-medium">
                {(user?.unsafeMetadata?.role === "driver"
                  ? ["Search", "Publish", "My Rides", "Safety"]
                  : ["Search", "My Rides", "Safety", "Help"]
                ).map((item) => (
                  <a
                    key={item}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item === "Publish") navigate("/driver/create-ride");
                      if (item === "Search") navigate("/rides/search");
                      if (item === "My Rides") {
                        if (user?.unsafeMetadata?.role === "driver") navigate("/driver/rides");
                        else navigate("/rider/rides");
                      }
                    }}
                    href="#"
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {item}
                  </a>
                ))}
              </nav>

              <SignedOut>
                <div className="flex items-center gap-3">
                  <SignInButton mode="modal">
                    <button className="px-5 py-2.5 rounded-full text-sm font-semibold text-[var(--color-text-primary)] hover:bg-gray-100 transition">
                      Log in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[var(--color-primary)]/30">
                      Sign up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition border border-transparent hover:border-gray-200"
                  >
                    <span className="text-sm font-medium hidden sm:block text-[var(--color-text-primary)]">
                      {user?.firstName || "User"}
                    </span>
                    <img
                      src={user?.imageUrl}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                      </div>
                      <button
                        onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                      >
                        <UserCircle className="w-5 h-5 text-gray-400" /> Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          if (user?.unsafeMetadata?.role === "driver") navigate("/driver/rides");
                          else navigate("/rider/rides");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                      >
                        <Car className="w-5 h-5 text-gray-400" /> My Rides
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={async () => { setShowDropdown(false); await signOut(); }}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 transition"
                      >
                        <LogOut className="w-5 h-5" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </SignedIn>
            </div>
          </div>
        </header>

        {/* ================= HERO ================= */}
        <section className="relative w-full hero-section-container">

          {/* Background elements - contained */}
          <div className="absolute inset-0 overflow-hidden -z-10 rounded-b-[3rem]">
            <div className="absolute inset-0 bg-white/40" />
            <div className="hero-blob hero-blob--blue" />
            <div className="hero-blob hero-blob--cyan" />
          </div>

          <div className="max-w-7xl mx-auto px-6 pt-8 pb-20 md:pt-16 md:pb-32 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">

            {/* Left Content */}
            <div className="flex flex-col gap-6 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-muted)] w-fit border border-[var(--color-primary)]/20 fade-in-up delay-1">
                <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide">New Way to Travel</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-[var(--color-text-primary)] fade-in-up delay-1">
                Let's travel <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]">together.</span>
              </h1>

              <p className="text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-lg fade-in-up delay-2">
                Connect with drivers heading your way. Save money, reduce carbon footprint, and make new friends on the road.
              </p>

              {/* Search Component - Enlarged & Refined */}
              <div className="mt-4 hero-card p-3 fade-in-up delay-3 w-full shadow-2xl border border-[var(--color-primary)]/10">
                <div className="flex flex-col gap-3">

                  {/* Inputs Row */}
                  <div className="flex flex-col md:flex-row gap-3 w-full">
                    {/* Origin */}
                    <div className="flex-1 relative group bg-gray-50 rounded-xl hover:bg-white transition-colors border border-transparent focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                        <div className="w-3 h-3 rounded-full border-[3px] border-current"></div>
                      </div>
                      <Autocomplete
                        onLoad={(autocomplete) => { originAutoRef.current = autocomplete; }}
                        onPlaceChanged={() => { destinationRef.current?.focus(); }}
                      >
                        <input
                          ref={originRef}
                          placeholder="Leaving from..."
                          className="w-full h-16 pl-12 pr-4 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-lg font-semibold rounded-xl transition-all truncate"
                        />
                      </Autocomplete>
                    </div>

                    {/* Destination */}
                    <div className="flex-1 relative group bg-gray-50 rounded-xl hover:bg-white transition-colors border border-transparent focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <Autocomplete
                        onLoad={(autocomplete) => { destinationAutoRef.current = autocomplete; }}
                        onPlaceChanged={() => { setShowCalendar(true); }}
                      >
                        <input
                          ref={destinationRef}
                          placeholder="Going to..."
                          className="w-full h-16 pl-12 pr-4 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-lg font-semibold rounded-xl transition-all truncate"
                        />
                      </Autocomplete>
                    </div>
                  </div>

                  {/* Options Row */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {/* Date Picker */}
                    <div className="relative flex-1" ref={calendarWrapperRef}>
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`w-full h-16 px-4 flex items-center justify-between bg-gray-50 hover:bg-white border border-transparent rounded-xl transition-all outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 ${showCalendar ? 'border-[var(--color-primary)] bg-white ring-4 ring-[var(--color-primary)]/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIcon className={`w-6 h-6 ${date ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                          <div className="text-left">
                            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Date</p>
                            <span className={`text-base font-bold whitespace-nowrap ${date ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                              {date ? format(date, "d MMM, yyyy") : "Select Date"}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Absolute Calendar Popover */}
                      {showCalendar && (
                        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 daypicker-popover z-[100] transform transition-all origin-top-left">
                          <DayPicker
                            mode="single"
                            selected={date}
                            onSelect={(selectedDate) => { setDate(selectedDate); setShowCalendar(false); }}
                            disabled={{ before: new Date() }}
                            modifiersClassNames={{
                              selected: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]',
                              today: 'text-[var(--color-primary)] font-bold'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Passengers */}
                    <div className="h-16 px-4 flex items-center justify-between gap-4 bg-gray-50 hover:bg-white border border-transparent rounded-xl transition-all flex-1">
                      <div className="flex items-center gap-3">
                        <User className="w-6 h-6 text-[var(--color-text-muted)]" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Passengers</span>
                          <span className="text-base font-bold text-[var(--color-text-primary)]">{passengers} Person{passengers > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPassengers(Math.max(1, passengers - 1)); }}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-gray-50 text-[var(--color-primary)] disabled:opacity-50 border border-gray-200"
                          disabled={passengers <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPassengers(Math.min(6, passengers + 1)); }}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-gray-50 text-[var(--color-primary)] border border-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={calculateRoute}
                    className="w-full h-16 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white rounded-xl font-bold text-xl shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <Search className="w-6 h-6" />
                    <span>Search Rides</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="hidden lg:block relative h-full min-h-[500px] w-full fade-in-up delay-2">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/20 to-transparent rounded-[2rem] transform rotate-3 translate-x-2 translate-y-2"></div>
              <div className="hero-right-image h-full w-full rounded-[2rem] overflow-hidden shadow-2xl relative z-10 border-4 border-white">
                <img
                  src={carSharing}
                  alt="Carpooling journey"
                  className="w-full h-full object-cover"
                />
                {/* Floating Badge */}
                <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <ShieldCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Trust & Safety</p>
                      <p className="font-bold text-gray-900">Verified Drivers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ROUTE INFO ================= */}
        {distance && (
          <div className="max-w-4xl mx-auto px-6 mb-12">
            <div className="bg-[var(--color-surface)] rounded-2xl shadow-lg border border-[var(--color-border)] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-[var(--color-primary-muted)] rounded-full text-[var(--color-primary)]">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[var(--color-text-secondary)] text-sm font-medium uppercase tracking-wider mb-1">Route Details</p>
                  <div className="flex items-baseline gap-4">
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{distance}</p>
                    <span className="text-gray-300">|</span>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{duration}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={clearRoute}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
              >
                Clear Route
              </button>
            </div>
          </div>
        )}

        {/* ================= MAP ================= */}
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto bg-white p-2 rounded-3xl shadow-lg border border-[var(--color-border)]">
            <div className="rounded-2xl overflow-hidden relative z-0">
              <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10} options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
              }}>
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </div>
          </div>
        </section>

        {/* ================= WHY US ================= */}
        <section className="py-24 bg-white relative overflow-hidden">
          {/* Decorative bg */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">Why choose RideShare?</h2>
              <p className="text-[var(--color-text-secondary)] text-lg">We're transforming the way you travel. Simpler, cheaper, and more connected.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: MapPin, title: "Your pick of rides", desc: "No matter where you’re going, find the perfect ride from our wide range of destinations and routes at low prices." },
                { icon: Wallet, title: "Trust who you travel with", desc: "We take the time to get to know each of our members and bus partners. We check reviews, profiles and IDs." },
                { icon: ShieldCheck, title: "Scroll, click, tap and go!", desc: "Booking a ride has never been easier! Thanks to our simple app powered by great technology, you can book a ride close to you in just minutes." }
              ].map((item, idx) => (
                <div key={idx} className="group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[var(--color-primary)] mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">{item.title}</h3>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="px-6 py-20 pb-32">
          <div className="max-w-7xl mx-auto bg-[var(--color-primary)] rounded-3xl p-10 md:p-16 text-center md:text-left relative overflow-hidden shadow-2xl">

            {/* Abstract pattern */}
            <div className="absolute top-0 right-0 p-16 opacity-10">
              <Car className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  Become a driver and save on travel costs
                </h3>
                <p className="text-white/80 text-lg mb-8">
                  Publish your ride in just a few clicks. You decide who goes with you and when.
                </p>
                <button
                  onClick={() => navigate("/driver/create-ride")}
                  className="bg-white text-[var(--color-primary)] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  Offer a ride
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-gray-200 bg-white pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[var(--color-primary)] p-1.5 rounded-md">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">RideShare</span>
              </div>
              <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                The reliable way to travel together. Safe, affordable, and sustainable.
              </p>
            </div>

            {[
              { title: "Company", items: ["About us", "Careers", "Press", "Blog"] },
              { title: "Support", items: ["Help Center", "Trust & Safety", "Terms of Service", "Privacy Policy"] },
              { title: "Download", items: ["iOS App", "Android App"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-[var(--color-text-primary)] mb-4">{col.title}</h4>
                <ul className="space-y-3 text-[var(--color-text-secondary)] text-sm">
                  {col.items.map((item) => (
                    <li key={item}><a href="#" className="hover:text-[var(--color-primary)] transition-colors">{item}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-6 border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
            <p>© 2024 RideShare Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-600">Privacy</a>
              <a href="#" className="hover:text-gray-600">Terms</a>
              <a href="#" className="hover:text-gray-600">Sitemap</a>
            </div>
          </div>
        </footer>
      </div>
    </LoadScript>
  );
}
