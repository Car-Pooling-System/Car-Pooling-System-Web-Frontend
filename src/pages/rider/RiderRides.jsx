import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
Plus,
CheckCircle,
Info,
XCircle,
Clock as PendingIcon,
FileText,
Loader2
} from "lucide-react";

import { useProfile } from "../../hooks/useProfile";
import Navbar from "../../components/layout/Navbar";

const RiderRides = () => {

const navigate = useNavigate();
const { data, loading, error } = useProfile();

const [filteredRides, setFilteredRides] = useState([]);

useEffect(() => {

if (data?.bookings) {  
  setFilteredRides(data.bookings);  
}

}, [data]);

const stats = data?.computed || {
completed: 0,
cancelled: 0,
totalFare: 0,
savedCO2: 0,
trustScore: 5.0
};

/* =============================
PAYMENT NAVIGATION
============================== */

const goToPayment = (ride) => {

const paymentRide = {  
  rideId: ride.id || ride._id,  
  driverName: ride.driverName || "Driver",  
  distance: ride.distance || 20,  
  price: ride.totalFare || ride.price || 0  
};  

navigate("/payment-summary", {  
  state: { ride: paymentRide }  
});

};

/* =============================
STATUS STYLE
============================== */

const getStatusStyle = (status) => {

switch (status?.toUpperCase()) {  

  case "CONFIRMED":  
    return "bg-emerald-100 text-emerald-700 border-emerald-200";  

  case "PENDING":  
    return "bg-amber-100 text-amber-700 border-amber-200";  

  case "COMPLETED":  
    return "bg-slate-100 text-slate-600 border-slate-200";  

  case "CANCELLED":  
    return "bg-rose-100 text-rose-700 border-rose-200";  

  default:  
    return "bg-gray-100 text-gray-600";  
}

};

const getStatusIcon = (status) => {

switch (status?.toUpperCase()) {  

  case "CONFIRMED":  
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;  

  case "PENDING":  
    return <PendingIcon className="w-5 h-5 text-amber-500" />;  

  case "COMPLETED":  
    return <CheckCircle className="w-5 h-5 text-slate-400" />;  

  case "CANCELLED":  
    return <XCircle className="w-5 h-5 text-rose-500" />;  

  default:  
    return null;  
}

};

/* =============================
LOADING STATE
============================== */

if (loading) {

return (  
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">  
    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />  
  </div>  
);

}

if (error) {

return (  
  <div className="min-h-screen flex items-center justify-center text-red-500">  
    Failed to load rides  
  </div>  
);

}

return (

<div className="min-h-screen bg-slate-50 font-sans text-slate-900">  

  <Navbar />  

  <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">  

    {/* ======================  
        RIDES LIST  
    ======================= */}  

    <div className="lg:col-span-2 space-y-6">  

      <div className="flex items-center justify-between">  

        <div>  
          <h1 className="text-3xl font-black text-slate-900">  
            My Rides  
          </h1>  

          <p className="text-slate-500 mt-1">  
            Showing {filteredRides.length} rides  
          </p>  
        </div>  

        <button  
          onClick={() => navigate("/")}  
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"  
        >  
          <Plus className="w-5 h-5" />  
          Book New Ride  
        </button>  

      </div>  

      <div className="space-y-4">  

        {filteredRides.length === 0 ? (  

          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">  

            <p className="text-slate-500 font-medium">  
              No rides found. Start your journey by booking a new ride!  
            </p>  

          </div>  

        ) : (  

          filteredRides.map((ride) => (  

            <div  
              key={ride.id || ride._id}  
              className={`bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow ${ride.status?.toUpperCase() === "CANCELLED" ? "opacity-60" : ""}`}  
            >  

              {/* TIME */}  

              <div className="flex flex-col items-center">  

                <span className="text-lg font-bold text-slate-800">  
                  {ride.departureTime?.split(" ")[0] || "--:--"}  
                </span>  

              </div>  

              {/* SOURCE */}  

              <div className="flex flex-col flex-1">  

                <h3 className="text-lg font-black text-slate-900">  
                  {ride.source || ride.pickupLocation}  
                </h3>  

              </div>  

              {/* DESTINATION */}  

              <div className="flex flex-col flex-1">  

                <h3 className="text-lg font-black text-slate-900">  
                  {ride.destination || ride.dropoffLocation}  
                </h3>  

              </div>  

              {/* PRICE */}  

              <div className="flex flex-col md:items-end min-w-[100px]">  

                <span className="text-xl font-black text-slate-900">  
                  ${(ride.totalFare || ride.price || 0).toFixed(2)}  
                </span>  

              </div>  

              {/* STATUS */}  

              <div  
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(ride.status)} uppercase`}  
              >  
                {ride.status}  
              </div>  

              {/* ACTIONS */}  

              <div className="flex gap-2">  

                <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">  

                  <Info className="w-4 h-4" />  

                </button>  

                {/* PAYMENT BUTTON */}  

                {(ride.status === "CONFIRMED" || ride.status === "PENDING") && (  

                  <button  
                    onClick={() => goToPayment(ride)}  
                    className="px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"  
                  >  
                    Pay  
                  </button>  

                )}  

                {/* RECEIPT */}  

                {ride.status === "COMPLETED" && (  

                  <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400">  

                    <FileText className="w-4 h-4" />  

                  </button>  

                )}  

              </div>  

            </div>  

          ))  

        )}  

      </div>  

    </div>  

    {/* ======================  
        RIGHT PANEL  
    ======================= */}  

    <div className="space-y-6">  

      <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl">  

        <h2 className="text-2xl font-black">  
          Trips  
        </h2>  

        <p className="text-slate-400 text-sm">  
          {stats.completed + stats.cancelled} rides  
        </p>  

      </div>  

    </div>  

  </div>  

</div>

);
};

export default RiderRides;

