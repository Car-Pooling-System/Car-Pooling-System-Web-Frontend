import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router-dom";

export default function DriverRides() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    if (user?.unsafeMetadata?.role !== "driver") {
        return <Navigate to="/home" />;
    }

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const res = await axios.get(
                    `${BACKEND_URL}/api/driver-rides/${user.id}`
                );
                setRides(res.data);
            } catch (err) {
                console.error("FAILED TO FETCH RIDES:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRides();
    }, [user.id]);

    if (loading) return <p className="p-6">Loading rides...</p>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-bold">My Rides</h1>

            {rides.length === 0 && (
                <p className="text-gray-500">No rides created yet.</p>
            )}

            {rides.map((ride) => (
                <div
                    key={ride._id}
                    onClick={() => navigate(`/driver/rides/${ride._id}`)}
                    className="border rounded p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                >
                    <div>
                        <p className="font-semibold">
                            {ride.route.start.name} → {ride.route.end.name}
                        </p>

                        <p className="text-sm text-gray-600">
                            🕒 {new Date(ride.schedule.departureTime).toLocaleString()}
                        </p>

                        <p className="text-sm">
                            📏 {ride.metrics.totalDistanceKm.toFixed(1)} km · ⏱{" "}
                            {Math.round(ride.metrics.durationMinutes)} mins
                        </p>

                        <p className="text-sm">
                            💺 {ride.seats.available}/{ride.seats.total} seats
                        </p>
                    </div>

                    <div
                        className="flex gap-3"
                        onClick={(e) => e.stopPropagation()} // 🔑 prevent navigation
                    >
                        <button
                            className="px-4 py-2 bg-gray-200 rounded"
                            onClick={() => navigate(`/driver/rides/${ride._id}/edit`)}
                        >
                            Edit
                        </button>

                        <button
                            className="px-4 py-2 bg-red-500 text-white rounded"
                            onClick={() =>
                                console.log("CANCEL RIDE ID:", ride._id)
                            }
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
