import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import theme from "../../theme";

export default function PaymentFailed() {

  const navigate = useNavigate();

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;

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
          padding: spacing.xxl,
          borderRadius: theme.components.card.radius,
          boxShadow: theme.base.shadows.soft,
          width: "420px",
          border: `1px solid ${colors.border}`,
          textAlign: "center"
        }}
      >

        <XCircle
          size={60}
          color="#ef4444"
          style={{ marginBottom: spacing.lg }}
        />

        <h1
          style={{
            fontSize: typography.fontSize.h4,
            marginBottom: spacing.md
          }}
        >
          Payment Failed
        </h1>

        <p
          style={{
            color: colors.text.secondary,
            marginBottom: spacing.xl
          }}
        >
          Something went wrong while processing your payment.
          Please try again.
        </p>

        <button
          onClick={() => navigate("/payment-summary")}
          style={{
            background: colors.primary,
            color: colors.text.inverse,
            border: "none",
            padding: theme.components.button.padding,
            borderRadius: theme.components.button.radius,
            fontWeight: theme.components.button.fontWeight,
            cursor: "pointer",
            width: "100%",
            marginBottom: spacing.md
          }}
        >
          Retry Payment
        </button>

        <button
          onClick={() => navigate("/my-rides")}
          style={{
            background: "#e5e7eb",
            border: "none",
            padding: theme.components.button.padding,
            borderRadius: theme.components.button.radius,
            cursor: "pointer",
            width: "100%"
          }}
        >
          Back to My Rides
        </button>

      </div>

    </div>
  );
}