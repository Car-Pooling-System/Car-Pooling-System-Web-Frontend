import { apiClient } from "./apiClient";

export async function fetchDriverVehicles(userId) {
  try {
    const modernResponse = await apiClient.get(`/driver-vehicles/${userId}`);
    if (Array.isArray(modernResponse.data?.vehicles)) {
      return modernResponse.data.vehicles;
    }
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }
  }

  try {
    const legacyResponse = await apiClient.get(`/driver-vehicle/${userId}`);
    if (legacyResponse.data) {
      return [legacyResponse.data];
    }
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }
  }

  return [];
}
