import axios from "axios";

export const createOrder = async (amount, rideId) => {

  const res = await axios.post(
    "http://localhost:3000/api/razorpay/create-order",
    {
      amount,
      rideId
    }
  );

  return res.data;
};