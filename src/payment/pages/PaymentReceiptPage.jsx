import { useLocation, useNavigate } from "react-router-dom";
import theme from "../../theme";

export default function PaymentReceiptPage() {

  const location = useLocation();
  const navigate = useNavigate();

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;
  const radius = theme.base.radius;
  const shadows = theme.base.shadows;

  const payment = location.state?.payment;

  if (!payment) {
    return <div style={{ padding: "40px" }}>Invalid receipt data</div>;
  }

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
          borderRadius: radius.lg,
          boxShadow: shadows.soft,
          border: `1px solid ${colors.border}`,
          width: "420px"
        }}
      >

        <h2 style={{ marginBottom: spacing.lg }}>
          Payment Receipt
        </h2>

        <p><b>Ride ID:</b> {payment.rideId}</p>
        <p><b>Driver:</b> {payment.driverName}</p>
        <p><b>Distance:</b> {payment.distance} km</p>
        <p><b>Fare:</b> ₹{payment.price}</p>

        <p>
          <b>Transaction ID:</b> {payment.transactionId}
        </p>

        <p>
          <b>Status:</b>
          <span style={{ color: "green", marginLeft: "6px" }}>
            SUCCESS
          </span>
        </p>

        <p>
          <b>Date:</b> {new Date().toLocaleString()}
        </p>

        <button
          onClick={() => navigate("/my-rides")}
          style={{
            marginTop: spacing.lg,
            width: "100%",
            padding: "12px",
            borderRadius: radius.pill,
            border: "none",
            background: colors.primary,
            color: colors.text.inverse,
            cursor: "pointer"
          }}
        >
          Back to My Rides
        </button>

      </div>

    </div>

  );

}
