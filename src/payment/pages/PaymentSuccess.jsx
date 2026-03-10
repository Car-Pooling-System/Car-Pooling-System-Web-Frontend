import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {

  const navigate = useNavigate();

  const paymentData = JSON.parse(
    sessionStorage.getItem("paymentData")
  );

  if (!paymentData) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">

        <div className="bg-white p-8 rounded-xl shadow text-center">

          <p className="text-slate-600">
            Invalid payment data
          </p>

          <button
            onClick={() => navigate("/my-rides")}
            className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Back to My Rides
          </button>

        </div>

      </div>
    );

  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-slate-50">

      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">

        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Payment Successful
        </h1>

        <div className="bg-slate-50 rounded-xl p-6 text-left space-y-3">

          <p><b>Ride ID:</b> {paymentData.rideId}</p>
          <p><b>Transaction:</b> {paymentData.transactionId}</p>
          <p><b>Driver:</b> {paymentData.driverName}</p>
          <p><b>Distance:</b> {paymentData.distance} km</p>
          <p><b>Amount:</b> ₹{paymentData.amount}</p>

        </div>

        <button
          onClick={() => navigate("/my-rides")}
          className="mt-6 w-full py-3 bg-emerald-500 text-white font-bold rounded-xl"
        >
          Back to My Rides
        </button>

      </div>

    </div>

  );

}