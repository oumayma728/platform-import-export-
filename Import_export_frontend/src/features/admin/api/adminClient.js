import axios from "axios";
import { getAdminToken, clearAdminToken } from "../../../utils/adminTokenStorage";

/**
 * Client axios dédié aux routes /admin/* : il attache le JWT admin
 * (identité séparée, spec §4) et, en cas de 401, renvoie vers la page
 * de connexion admin.
 */
const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

adminClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAdminLoginPage = window.location.pathname === "/admin/login";
    if (error.response?.status === 401 && !isAdminLoginPage) {
      clearAdminToken();
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default adminClient;
