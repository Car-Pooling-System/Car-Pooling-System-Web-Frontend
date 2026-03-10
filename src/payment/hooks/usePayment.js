import { useState } from "react";
import {
  createPayment,
  updatePaymentStatus,
} from "../services/paymentService";

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initiatePayment = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      return await createPayment(payload);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId, body) => {
    try {
      setLoading(true);
      setError(null);
      return await updatePaymentStatus(paymentId, body);
    } catch (err) {
      setError(err.response?.data?.message || "Status update failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    initiatePayment,
    confirmPayment,
  };
};