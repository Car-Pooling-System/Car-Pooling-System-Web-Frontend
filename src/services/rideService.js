import { apiClient } from "./apiClient";

export async function createRide(payload) {
  const response = await apiClient.post("/rides", payload);
  return response.data;
}
