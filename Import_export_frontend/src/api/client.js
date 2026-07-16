import axios from "axios";
import { getToken, clearToken } from "../utils/tokenStorage";

export const USE_MOCKS = true;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur : injecte le token d'auth automatiquement (localStorage ou
// sessionStorage selon l'option "rester connecté" choisie à la connexion)
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : gestion centralisée des erreurs 401 (session expirée ou invalide)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
