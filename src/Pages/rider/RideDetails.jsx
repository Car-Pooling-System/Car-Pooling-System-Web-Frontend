import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function RideDetails() {
    const { rideId } = useParams();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [ride, setRide] = useState(null);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/api/rides/${rideId}`)
            .then((res) => setRide(res.data));
    }, [rideId]);

    if (!ride) return <p>Loading...</p>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold">
                {ride.route.start.name} → {ride.route.end.name}
            </h1>

            <div className="mt-4">
                <p className="font-semibold">Driver</p>
                <div className="flex items-center gap-2">
                    <img
                        src={ride.driver.profileImage}
                        className="w-10 h-10 rounded-full"
                    />
                    <p>{ride.driver.name}</p>
                </div>
            </div>

            <div className="mt-6">
                <p className="font-semibold">Passengers</p>
                {ride.passengers.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 mt-2">
                        <img
                            src={p.profileImage}
                            className="w-8 h-8 rounded-full"
                        />
                        <p>{p.name}</p>
                    </div>
                ))}
            </div>

            <button className="mt-6 px-6 py-2 bg-green-600 text-white rounded">
                Book Ride
            </button>
        </div>
    );
}
