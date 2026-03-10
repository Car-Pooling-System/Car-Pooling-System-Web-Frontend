import { useNavigate, useLocation } from "react-router-dom";
import theme from "../../theme";

export default function PaymentSummaryPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const ride = location.state?.ride || {
    rideId: "RIDE123",
    driverName: "John Doe",
    distance: 20,
    price: 200
  };

  const handleConfirm = () => {
    navigate("/payment", { state: { ride } });
  };

  return (
    <div
      style={{
        background: theme.light.colors.background,
        minHeight: "100vh",
        padding: theme.base.spacing.xl,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >

      <div
        style={{
          background: theme.light.colors.surface,
          padding: theme.base.spacing.xxl,
          borderRadius: theme.base.radius.lg,
          boxShadow: theme.base.shadows.medium,
          width: "420px"
        }}
      >

        <h2
          style={{
            fontFamily: theme.base.typography.fontFamily.heading,
            fontSize: theme.base.typography.fontSize.h4,
            marginBottom: theme.base.spacing.lg
          }}
        >
          Payment Summary
        </h2>

        <div style={{ marginBottom: theme.base.spacing.md }}>
          <strong>Ride ID:</strong> {ride.rideId}
        </div>

        <div style={{ marginBottom: theme.base.spacing.md }}>
          <strong>Driver:</strong> {ride.driverName}
        </div>

        <div style={{ marginBottom: theme.base.spacing.md }}>
          <strong>Distance:</strong> {ride.distance} km
        </div>

        <div style={{ marginBottom: theme.base.spacing.md }}>
          <strong>Fare:</strong> ₹{ride.price}
        </div>

        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            marginTop: theme.base.spacing.lg,
            padding: theme.base.spacing.md,
            borderRadius: theme.base.radius.pill,
            border: "none",
            background: theme.light.colors.primary,
            color: "#000",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Confirm & Pay
        </button>

      </div>

    </div>
  );
}