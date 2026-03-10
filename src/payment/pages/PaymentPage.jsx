import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import theme from "../../theme";

export default function PaymentPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const ride = location.state?.ride;

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;

  const [loading, setLoading] = useState(false);

  if (!ride) {
    navigate("/my-rides");
    return null;
  }

  const handlePayment = async () => {

    try {

      setLoading(true);

      console.log("STEP 1: Creating payment record");

      /* =========================
         STEP 1 CREATE PAYMENT
      ========================= */

      const paymentRes = await axios.post(
        "http://localhost:3000/api/payment",
        {
          rideId: ride.rideId,
          passengerId: "USER1",
          driverId: "DRIVER1",
          boardingKm: 0,
          dropKm: ride.distance,
          paymentMethod: "upi"
        }
      );

      const payment = paymentRes.data.payment;

      console.log("Payment created:", payment);

      /* =========================
         STEP 2 CREATE RAZORPAY ORDER
      ========================= */

      console.log("STEP 2: Creating Razorpay order");

      const orderRes = await axios.post(
        "http://localhost:3000/api/razorpay/create-order",
        {
          amount: ride.price,
          rideId: ride.rideId
        }
      );

      const order = orderRes.data.order || orderRes.data;

      console.log("Order received:", order);

      if (!order || !order.id) {
        console.error("Invalid Razorpay order");
        alert("Payment gateway error. Try again.");
        return;
      }

      /* =========================
         STEP 3 OPEN RAZORPAY
      ========================= */

      const options = {

        key: "rzp_test_SOlYwfWqc5ynRn",

        amount: order.amount,
        currency: order.currency || "INR",

        name: "Car Pooling System",
        description: "Ride Payment",

        order_id: order.id,

        handler: async function (response) {

          console.log("STEP 4: PAYMENT SUCCESS");
          console.log(response);

          try {

            /* VERIFY PAYMENT */

            await axios.post(
              "http://localhost:3000/api/razorpay/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: payment._id
              }
            );

            console.log("Payment verified");

          } catch (err) {

            console.log("Verification error:", err);

          }

          /* STORE PAYMENT DATA */

          const paymentData = {
            rideId: ride.rideId,
            driverName: ride.driverName,
            distance: ride.distance,
            amount: ride.price,
            transactionId: response.razorpay_payment_id
          };

          console.log("Saving paymentData:", paymentData);

          sessionStorage.setItem(
            "paymentData",
            JSON.stringify(paymentData)
          );

          /* NAVIGATE */

          setTimeout(() => {

            navigate("/payment-success");

          }, 300);

        },

        prefill: {
          name: "Passenger",
          email: "test@email.com"
        },

        theme: {
          color: "#22c55e"
        }

      };

      console.log("Opening Razorpay");

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {

        console.error("Payment failed:", response);

        navigate("/payment-failed");

      });

      rzp.open();

    } catch (error) {

      console.error("Payment error:", error);

      alert(
        "Payment API error:\n" +
        JSON.stringify(error.response?.data || error)
      );

      navigate("/payment-failed");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div
      style={{
        background: colors.background,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: typography.fontFamily.primary
      }}
    >

      <div
        style={{
          background: colors.surface,
          padding: spacing.xl,
          borderRadius: 16,
          boxShadow: "0 6px 18px rgba(0,0,0,.08)",
          width: "420px",
          border: `1px solid ${colors.border}`
        }}
      >

        <h1
          style={{
            fontSize: typography.fontSize.h3,
            marginBottom: spacing.lg,
            color: colors.text.primary
          }}
        >
          Ride Payment
        </h1>

        <p><b>Ride ID:</b> {ride.rideId}</p>
        <p><b>Driver:</b> {ride.driverName}</p>
        <p><b>Distance:</b> {ride.distance} km</p>
        <p><b>Total Fare:</b> ₹{ride.price}</p>

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            marginTop: spacing.lg,
            background: colors.primary,
            color: colors.text.inverse,
            border: "none",
            padding: "12px 22px",
            borderRadius: "999px",
            fontWeight: 600,
            cursor: "pointer",
            width: "100%"
          }}
        >

          {loading ? "Opening Razorpay..." : "Pay Now"}

        </button>

      </div>

    </div>

  );

}