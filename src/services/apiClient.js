import axios from "axios";

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.EXPO_PUBLIC_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.EXPO_PUBLIC_BACKEND_URL ||
  "http://localhost:3000/api";

const baseURL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

export const apiClient = axios.create({
  baseURL: baseURL.endsWith("/api") ? baseURL : `${baseURL}/api`,
  withCredentials: false,
});
