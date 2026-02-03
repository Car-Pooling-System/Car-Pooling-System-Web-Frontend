import { useRef, useState } from "react";
import axios from "axios";
import {
    LoadScript,
    Autocomplete,
} from "@react-google-maps/api";

const MAP_LIBRARIES = ["places"];

export default function SearchRides() {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const pickupRef = useRef(null);
    const dropRef = useRef(null);

    const [results, setResults] = useState([]);

    const searchRides = async () => {
        const pickup = pickupRef.current?.getPlace?.();
        const drop = dropRef.current?.getPlace?.();

        if (!pickup?.geometry || !drop?.geometry) {
            alert("Select valid locations");
            return;
        }

        const params = {
            pickupLat: pickup.geometry.location.lat(),
            pickupLng: pickup.geometry.location.lng(),
            dropLat: drop.geometry.location.lat(),
            dropLng: drop.geometry.location.lng(),
        };

        console.log("SEARCHING RIDES WITH PARAMS:", params);

        try {
            const res = await axios.get(
                `${BACKEND_URL}/api/rides/search`,
                { params }
            );
            console.log("SEARCH RESULTS FROM BACKEND:", res.data);
            setResults(res.data);
        } catch (error) {
            console.error("SEARCH ERROR:", error.response?.data || error.message);
            alert("Failed to search rides. Please try again.");
        }
    };

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={MAP_LIBRARIES}
        >
            <div className="max-w-3xl mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-bold">Find a Ride</h1>

                <Autocomplete onLoad={(a) => (pickupRef.current = a)}>
                    <input className="border p-2 w-full" placeholder="Pickup" />
                </Autocomplete>

                <Autocomplete onLoad={(a) => (dropRef.current = a)}>
                    <input className="border p-2 w-full" placeholder="Drop" />
                </Autocomplete>

                <button
                    onClick={searchRides}
                    className="bg-black text-white px-4 py-2"
                >
                    Search
                </button>

                <div className="space-y-4">
                    {results.map((ride) => (
                        <div
                            key={ride.id}
                            className="border p-4 rounded"
                        >
                            <h3 className="font-semibold">
                                {ride.driver.name}
                            </h3>
                            <p>Seats: {ride.seatsAvailable}</p>
                            <p>Fare: ₹{ride.estimate.fare}</p>
                            <p>
                                Pets: {ride.preferences.petsAllowed ? "Yes" : "No"} |
                                Smoking: {ride.preferences.smokingAllowed ? "Yes" : "No"}
                            </p>

                            <button
                                className="mt-2 bg-blue-600 text-white px-3 py-1"
                                onClick={() =>
                                    alert(`Book ride ${ride.id}`)
                                }
                            >
                                Book
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </LoadScript>
    );
}