import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const baseURL = configuredBaseUrl ||
  (import.meta.env.DEV ? "http://localhost:8080/api" : "/api");

const api = axios.create({
  baseURL,
});

export default api;
