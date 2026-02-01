import React, { useRef, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 13.0827, // Chennai (default)
  lng: 80.2707,
};

export default function HomePage() {
  const originRef = useRef();
  const destinationRef = useRef();

  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");

  const calculateRoute = async () => {
    if (
      originRef.current.value === "" ||
      destinationRef.current.value === ""
    ) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const results = await directionsService.route({
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
      <div style={{ padding: "10px" }}>
        <h2>Google Maps Route Finder</h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <Autocomplete>
            <input
              type="text"
              placeholder="Start Location"
              ref={originRef}
              style={{ width: "200px", padding: "5px" }}
            />
          </Autocomplete>

          <Autocomplete>
            <input
              type="text"
              placeholder="Destination"
              ref={destinationRef}
              style={{ width: "200px", padding: "5px" }}
            />
          </Autocomplete>

          <button onClick={calculateRoute}>Find Route</button>
          <button onClick={clearRoute}>Clear</button>
        </div>

        {distance && duration && (
          <p>
            📏 Distance: <b>{distance}</b> | ⏱ Duration: <b>{duration}</b>
          </p>
        )}

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
        >
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>
    </LoadScript>
  );
}
