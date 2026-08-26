import axios from "axios";
import { getToken, clearToken } from "../utils/tokenStorage";

export const USE_MOCKS = false;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});


apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sur les pages /auth/* (login, register) on laisse le composant
    // afficher l'erreur (ex: "Aucun compte associé à cet email") au lieu
    // de rediriger. Ailleurs, un 401 = session expirée -> retour au login.
    const isAuthPage = window.location.pathname.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthPage) {
      clearToken();
      window.location.href = "/auth/login";
    }
    if (error.response?.status === 403 && error.response?.data?.detail?.includes("suspendu")) {
      clearToken();
      window.location.href = "/auth/login?reason=suspended";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
