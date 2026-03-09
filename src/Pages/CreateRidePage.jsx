import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Autocomplete, DirectionsRenderer, GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { fetchDriverVehicles } from "../services/driverService";
import { createRide } from "../services/rideService";
import { buildRouteData, buildRouteDataFromPath } from "../utils/ridePayload";

const DEFAULT_FORM = {
  userId: "",
  startLabel: "",
  startLat: "",
  startLng: "",
  endLabel: "",
  endLat: "",
  endLng: "",
  departureDate: new Date().toISOString().slice(0, 10),
  departureTime: "08:30",
  baseFare: "0",
  additionalFare: "0",
  breakDuration: "15",
  totalSeats: 3,
  frontSeat: 1,
  backWindowSeat: 2,
  backMiddleSeat: 0,
  max2Allowed: false,
  smokingAllowed: false,
  petsAllowed: false,
};

function getSavedUserId() {
  const keys = ["rideshare_user_id", "userId", "driver_user_id"];
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

const GOOGLE_LIBRARIES = ["places"];
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  import.meta.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "";

export function CreateRidePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, userId: getSavedUserId() }));
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const [startAutocomplete, setStartAutocomplete] = useState(null);
  const [endAutocomplete, setEndAutocomplete] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [directionsError, setDirectionsError] = useState("");
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  });

  const seatTotalAllocated = form.frontSeat + form.backWindowSeat + form.backMiddleSeat;
  const seatsRemaining = form.totalSeats - seatTotalAllocated;
  const selectedVehicle = vehicles[selectedVehicleIndex] || null;

  const routePreview = useMemo(() => {
    if (directionsResult?.routes?.[0]?.legs?.[0]) {
      const leg = directionsResult.routes[0].legs[0];
      return {
        distanceKm: Number(((leg.distance?.value || 0) / 1000).toFixed(1)),
        durationMinutes: Math.round((leg.duration?.value || 0) / 60),
      };
    }

    const start = { lat: toNumber(form.startLat), lng: toNumber(form.startLng) };
    const end = { lat: toNumber(form.endLat), lng: toNumber(form.endLng) };
    if (!start.lat || !start.lng || !end.lat || !end.lng) return { distanceKm: 0, durationMinutes: 0 };

    return buildRouteData({ start, end, startLabel: form.startLabel, endLabel: form.endLabel }).preview;
  }, [directionsResult, form.startLat, form.startLng, form.endLat, form.endLng, form.startLabel, form.endLabel]);

  useEffect(() => {
    if (!isMapsLoaded) return;
    if (!form.startLabel.trim() || !form.endLabel.trim()) return;
    if (typeof window.google === "undefined") return;

    let cancelled = false;
    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: form.startLabel,
        destination: form.endLabel,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        if (status === "OK" && result?.routes?.length) {
          setDirectionsResult(result);
          setDirectionsError("");
        } else {
          setDirectionsResult(null);
          setDirectionsError("Could not load route for selected places.");
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isMapsLoaded, form.startLabel, form.endLabel]);

  useEffect(() => {
    if (!form.userId) return;
    let active = true;

    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setVehicleError("");
      try {
        const data = await fetchDriverVehicles(form.userId);
        if (!active) return;
        setVehicles(data);
        setSelectedVehicleIndex(0);
      } catch {
        if (!active) return;
        setVehicleError("Unable to fetch vehicles for this user ID.");
      } finally {
        if (active) setLoadingVehicles(false);
      }
    };

    fetchVehicles();

    return () => {
      active = false;
    };
  }, [form.userId]);

  const setValue = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "startLabel" || key === "endLabel") {
      setDirectionsResult(null);
      setDirectionsError("");
    }
  };

  const handlePlaceChanged = (field) => () => {
    const autocomplete = field === "start" ? startAutocomplete : endAutocomplete;
    const place = autocomplete?.getPlace?.();
    const location = place?.geometry?.location;
    const formatted = place?.formatted_address || place?.name;
    if (!location || !formatted) return;

    setForm((prev) =>
      field === "start"
        ? {
          ...prev,
          startLabel: formatted,
          startLat: String(location.lat()),
          startLng: String(location.lng()),
        }
        : {
          ...prev,
          endLabel: formatted,
          endLat: String(location.lat()),
          endLng: String(location.lng()),
        },
    );
  };

  const bump = (key, delta, min = 0, max = 15) => {
    setForm((prev) => {
      const next = Math.min(max, Math.max(min, prev[key] + delta));
      return { ...prev, [key]: next };
    });
  };

  const ensureSeatBalance = () => {
    if (seatsRemaining >= 0) return true;
    setSubmitState((prev) => ({ ...prev, error: "Seat allocation exceeds total seats offered." }));
    return false;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitState({ loading: false, error: "", success: "" });

    if (!form.userId.trim()) {
      setSubmitState({ loading: false, error: "Driver user ID is required.", success: "" });
      return;
    }

    if (!selectedVehicle) {
      setSubmitState({ loading: false, error: "Add a vehicle first for this driver ID.", success: "" });
      return;
    }

    if (!ensureSeatBalance()) return;

    const departure = new Date(`${form.departureDate}T${form.departureTime}:00`);
    if (Number.isNaN(departure.getTime())) {
      setSubmitState({ loading: false, error: "Please provide a valid departure date and time.", success: "" });
      return;
    }

    const start = { lat: toNumber(form.startLat), lng: toNumber(form.startLng) };
    const end = { lat: toNumber(form.endLat), lng: toNumber(form.endLng) };

    const fallbackRouteData = buildRouteData({
      start,
      end,
      startLabel: form.startLabel,
      endLabel: form.endLabel,
    });
    const overviewPath =
      directionsResult?.routes?.[0]?.overview_path?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    const mapsRouteData = buildRouteDataFromPath({
      pathPoints: overviewPath,
      startLabel: form.startLabel,
      endLabel: form.endLabel,
    });
    const routeData = mapsRouteData || fallbackRouteData;

    const computedDuration =
      directionsResult?.routes?.[0]?.legs?.[0]?.duration?.value != null
        ? Math.round(directionsResult.routes[0].legs[0].duration.value / 60)
        : fallbackRouteData.preview.durationMinutes;

    const metricsDuration = computedDuration + toNumber(form.breakDuration);
    const payload = {
      driver: { userId: form.userId.trim() },
      vehicle: selectedVehicle,
      route: routeData.route,
      schedule: { departureTime: departure.toISOString() },
      pricing: {
        baseFare: Math.max(0, toNumber(form.baseFare) + toNumber(form.additionalFare)),
        currency: "INR",
      },
      preferences: {
        smokingAllowed: form.smokingAllowed,
        petsAllowed: form.petsAllowed,
        max2Allowed: form.max2Allowed,
      },
      seats: {
        total: form.totalSeats,
        available: form.totalSeats,
        seatTypes: [
          { type: "front", label: "Front Seat", count: form.frontSeat },
          { type: "backWindow", label: "Back Window Seat", count: form.backWindowSeat },
          { type: "backMiddle", label: "Back Middle Seat", count: form.backMiddleSeat },
        ],
      },
      metrics: {
        totalDistanceKm: routeData.metrics.totalDistanceKm,
        durationMinutes: metricsDuration,
      },
    };

    try {
      setSubmitState({ loading: true, error: "", success: "" });
      const createdRide = await createRide(payload);
      setSubmitState({ loading: false, error: "", success: "Ride created successfully." });
      if (createdRide?._id) {
        window.localStorage.setItem("last_created_ride_id", createdRide._id);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to create ride.";
      setSubmitState({ loading: false, error: message, success: "" });
    }
  };

  return (
    <section className="create-ride-page">
      <div className="create-ride-page__heading">
        <h1>Create a Ride</h1>
        <p>Set your route and preferences to start sharing journeys.</p>
      </div>

      <div className="map-preview">
        {isMapsLoaded ? (
          <GoogleMap
            mapContainerClassName="map-preview__canvas"
            center={{
              lat: (toNumber(form.startLat) + toNumber(form.endLat)) / 2 || 20.5937,
              lng: (toNumber(form.startLng) + toNumber(form.endLng)) / 2 || 78.9629,
            }}
            zoom={directionsResult ? 6 : 4}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {directionsResult && (
              <DirectionsRenderer
                directions={directionsResult}
                options={{
                  suppressMarkers: false,
                  polylineOptions: { strokeColor: "#20df63", strokeWeight: 6 },
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="map-preview__fallback">
            Set `VITE_GOOGLE_MAPS_API_KEY` (or `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`) to enable live map route preview.
          </div>
        )}
        <div className="map-preview__badge">
          <div>
            <span>Distance</span>
            <strong>{routePreview.distanceKm.toFixed(1)} km</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{formatDuration(routePreview.durationMinutes)}</strong>
          </div>
        </div>
        {directionsError && <p className="map-preview__error">{directionsError}</p>}
      </div>

      <form className="ride-form" onSubmit={onSubmit}>
        <div className="ride-form__main">
          <article className="card">
            <h2>Route Details</h2>
            <div className="field-grid field-grid--two">
              <label>
                Start Location
                {isMapsLoaded ? (
                  <Autocomplete
                    onLoad={setStartAutocomplete}
                    onPlaceChanged={handlePlaceChanged("start")}
                    options={{ fields: ["formatted_address", "geometry", "name"] }}
                  >
                    <input value={form.startLabel} onChange={setValue("startLabel")} required />
                  </Autocomplete>
                ) : (
                  <input value={form.startLabel} onChange={setValue("startLabel")} required />
                )}
              </label>
              <label>
                Destination
                {isMapsLoaded ? (
                  <Autocomplete
                    onLoad={setEndAutocomplete}
                    onPlaceChanged={handlePlaceChanged("end")}
                    options={{ fields: ["formatted_address", "geometry", "name"] }}
                  >
                    <input value={form.endLabel} onChange={setValue("endLabel")} required />
                  </Autocomplete>
                ) : (
                  <input value={form.endLabel} onChange={setValue("endLabel")} required />
                )}
              </label>
              <label>
                Date
                <input type="date" value={form.departureDate} onChange={setValue("departureDate")} required />
              </label>
              <label>
                Time
                <input type="time" value={form.departureTime} onChange={setValue("departureTime")} required />
              </label>
            </div>
          </article>

          <article className="card">
            <h2>Vehicle & Capacity</h2>
            <div className="field-grid">
              <label>
                Driver User ID
                <input
                  value={form.userId}
                  onChange={setValue("userId")}
                  placeholder="Enter backend driver user ID"
                  required
                />
              </label>
            </div>
            <label className="vehicle-select">
              Select Vehicle
              <select
                value={selectedVehicleIndex}
                onChange={(e) => setSelectedVehicleIndex(Number(e.target.value))}
                disabled={loadingVehicles || vehicles.length === 0}
              >
                {vehicles.map((vehicle, idx) => (
                  <option key={`${vehicle.licensePlate}-${idx}`} value={idx}>
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </option>
                ))}
                {!vehicles.length && <option value={0}>No vehicles available</option>}
              </select>
            </label>
            {vehicleError && <p className="inline-error">{vehicleError}</p>}

            <div className="seat-panel">
              <div className="seat-panel__header">
                <div>
                  <h3>Total Seats Offered</h3>
                  <p>How many passengers can join?</p>
                </div>
                <div className="stepper">
                  <button type="button" onClick={() => bump("totalSeats", -1, 1, 12)}>
                    -
                  </button>
                  <span>{form.totalSeats}</span>
                  <button type="button" onClick={() => bump("totalSeats", 1, 1, 12)}>
                    +
                  </button>
                </div>
              </div>
              <div className="seat-row">
                <span>Front Seat</span>
                <div className="stepper stepper--small">
                  <button type="button" onClick={() => bump("frontSeat", -1, 0, form.totalSeats)}>
                    -
                  </button>
                  <span>{form.frontSeat}</span>
                  <button type="button" onClick={() => bump("frontSeat", 1, 0, form.totalSeats)}>
                    +
                  </button>
                </div>
              </div>
              <div className="seat-row">
                <span>Back Window Seat</span>
                <div className="stepper stepper--small">
                  <button type="button" onClick={() => bump("backWindowSeat", -1, 0, form.totalSeats)}>
                    -
                  </button>
                  <span>{form.backWindowSeat}</span>
                  <button type="button" onClick={() => bump("backWindowSeat", 1, 0, form.totalSeats)}>
                    +
                  </button>
                </div>
              </div>
              <div className="seat-row">
                <span>Back Middle Seat</span>
                <div className="stepper stepper--small">
                  <button type="button" onClick={() => bump("backMiddleSeat", -1, 0, form.totalSeats)}>
                    -
                  </button>
                  <span>{form.backMiddleSeat}</span>
                  <button type="button" onClick={() => bump("backMiddleSeat", 1, 0, form.totalSeats)}>
                    +
                  </button>
                </div>
              </div>
              <div className={seatsRemaining === 0 ? "seat-balance seat-balance--ok" : "seat-balance"}>
                Allocated: {seatTotalAllocated} / {form.totalSeats}
              </div>
            </div>
          </article>
        </div>

        <aside className="ride-form__sidebar">
          <article className="card card--muted">
            <h2>Pricing</h2>
            <div className="field-grid field-grid--two">
              <label>
                Base Price (INR)
                <input type="number" min="0" step="0.01" value={form.baseFare} onChange={setValue("baseFare")} />
              </label>
              <label>
                Additional (INR)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.additionalFare}
                  onChange={setValue("additionalFare")}
                />
              </label>
            </div>
          </article>

          <article className="card">
            <h2>Resting Time</h2>
            <label>
              Break Duration (min)
              <input type="number" min="0" value={form.breakDuration} onChange={setValue("breakDuration")} />
            </label>
          </article>

          <article className="card">
            <h2>Ride Preferences</h2>
            <label className="check-row">
              <input type="checkbox" checked={form.max2Allowed} onChange={setValue("max2Allowed")} />
              <span>2 Passengers Only</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.smokingAllowed} onChange={setValue("smokingAllowed")} />
              <span>Smoking Allowed</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.petsAllowed} onChange={setValue("petsAllowed")} />
              <span>Pets Allowed</span>
            </label>
          </article>

          <div className="actions">
            <button className="btn btn--primary" type="submit" disabled={submitState.loading}>
              {submitState.loading ? "Creating..." : "Create Ride"}
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => navigate("/my-rides")}>
              Cancel and go back
            </button>
          </div>

          {submitState.error && <p className="status status--error">{submitState.error}</p>}
          {submitState.success && (
            <p className="status status--success">
              {submitState.success}{" "}
              <Link to="/my-rides" className="status__link">
                Go to My Rides
              </Link>
            </p>
          )}
        </aside>
      </form>

      <section className="trust-banner">
        <div>
          <h3>Trust & Safety</h3>
          <p>Every ride is protected by our community guidelines.</p>
        </div>
        <a href="#" aria-label="Learn more about trust and safety">
          Learn more
        </a>
      </section>
    </section>
  );
}
