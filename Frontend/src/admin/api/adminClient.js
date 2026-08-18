import axios from "axios";

const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Client Axios dédié à la partie admin.
 * Pointe directement sur le backend NestJS (port 3000).
 * Complètement séparé du client utilisateur (client.js → port 5000).
 */
const adminClient = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Pour les cookies HttpOnly (refresh token admin)
});

// Injecte le token admin dans chaque requête
adminClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sur 401 → on efface le token et on redirige vers la page login admin
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAdminToken();
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default adminClient;
