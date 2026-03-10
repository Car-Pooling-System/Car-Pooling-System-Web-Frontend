import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import theme from "../../theme";
import axios from "axios";

export default function DriverBankSetupPage() {

  const { user } = useUser();

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;
  const radius = theme.base.radius;
  const shadows = theme.base.shadows;

  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {

    setLoading(true);
    setMessage("");

    try {

      const userId = user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      await axios.put(
        `http://localhost:3000/api/driver-bank/${userId}`,
        {
          accountNumber,
          ifscCode: ifsc,
          upiId
        }
      );

      setMessage("Bank details saved successfully");

    } catch (err) {

      console.error("Bank save error:", err);
      setMessage("Failed to save bank details");

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

      <div style={{ width: "100%", maxWidth: "420px" }}>

        <h1
          style={{
            fontSize: typography.fontSize.h2,
            marginBottom: spacing.lg,
            color: colors.text.primary,
            textAlign: "center"
          }}
        >
          Driver Bank Details
        </h1>

        <div
          style={{
            background: colors.surface,
            padding: spacing.xl,
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >

          <h3 style={{ marginBottom: "4px" }}>
            Bank Account
          </h3>

          <input
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`
            }}
          />

          <input
            placeholder="IFSC Code"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`
            }}
          />

          <h3 style={{ marginTop: spacing.md }}>
            OR UPI
          </h3>

          <input
            placeholder="UPI ID"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`
            }}
          />

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              marginTop: spacing.md,
              background: colors.primary,
              color: colors.text.inverse,
              border: "none",
              padding: "12px",
              borderRadius: radius.pill,
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            {loading ? "Saving..." : "Save Bank Details"}
          </button>

          {message && (

            <p
              style={{
                marginTop: "8px",
                textAlign: "center",
                color: message.includes("success")
                  ? colors.status.success
                  : colors.status.error
              }}
            >
              {message}
            </p>

          )}

        </div>

      </div>

    </div>

  );

}