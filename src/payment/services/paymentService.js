import axios from "axios";

/*
========================================
AXIOS INSTANCE
========================================
*/

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


/*
========================================
GLOBAL RESPONSE INTERCEPTOR
========================================
*/

API.interceptors.response.use(
  (response) => response,

  (error) => {

    if (error.response) {

      console.error("API Error:", error.response.data);

      throw new Error(
        error.response.data?.message ||
        "Server error occurred"
      );

    }

    if (error.request) {

      console.error("Network Error");

      throw new Error(
        "Network error. Please check connection."
      );

    }

    throw new Error(error.message);

  }
);


/*
========================================
CREATE PAYMENT
POST /api/payment
========================================
*/

export const createPayment = async (payload) => {

  const { data } = await API.post("/api/payment", payload);

  return data;

};


/*
========================================
UPDATE PAYMENT STATUS
PUT /api/payment/:paymentId/status
========================================
*/

export const updatePaymentStatus = async (
  paymentId,
  body
) => {

  const { data } = await API.put(
    `/api/payment/${paymentId}/status`,
    body
  );

  return data;

};


/*
========================================
GET PAYMENT BY ID
GET /api/payment/:paymentId
========================================
*/

export const getPaymentById = async (paymentId) => {

  const { data } = await API.get(
    `/api/payment/${paymentId}`
  );

  return data;

};


/*
========================================
PASSENGER PAYMENT HISTORY
GET /api/payment/passenger/:passengerId
========================================
*/

export const getPassengerHistory = async (passengerId) => {

  const { data } = await API.get(
    `/api/payment/passenger/${passengerId}`
  );

  return data;

};


/*
========================================
DRIVER PAYMENTS
GET /api/payment/driver/:driverId
========================================
*/

export const getDriverPayments = async (driverId) => {

  const { data } = await API.get(
    `/api/payment/driver/${driverId}`
  );

  return data;

};


/*
========================================
DRIVER EARNINGS SUMMARY
GET /api/payment/driver/:driverId/earnings
========================================
*/

export const getDriverEarnings = async (driverId) => {

  const { data } = await API.get(
    `/api/payment/driver/${driverId}/earnings`
  );

  return data;

};


/*
========================================
DRIVER COMMISSION SUMMARY
GET /api/payment/driver/:driverId/commission
========================================
*/

export const getDriverCommission = async (driverId) => {

  const { data } = await API.get(
    `/api/payment/driver/${driverId}/commission`
  );

  return data;

};


/*
========================================
REQUEST REFUND
POST /api/payment/:paymentId/refund
========================================
*/

export const requestRefund = async (paymentId) => {

  const { data } = await API.post(
    `/api/payment/${paymentId}/refund`
  );

  return data;

};

export const settleDriverCommission = async (driverId) => {

  const { data } = await API.post(
    `/api/payment/driver/${driverId}/settle`
  );

  return data;

};

/*
========================================
EXPORT AXIOS INSTANCE
========================================
*/

export default API;