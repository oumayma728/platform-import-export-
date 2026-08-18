import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminLogin as apiAdminLogin, adminLogout as apiAdminLogout } from "../api/adminAuth";
import { getAdminToken, saveAdminToken, clearAdminToken } from "../api/adminClient";

/**
 * Décode le payload d'un JWT sans vérifier la signature.
 * Utilisé uniquement pour lire le rôle/expiration côté client.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    return JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au montage : on restaure la session admin si un token valide existe
  useEffect(() => {
    const token = getAdminToken();

    if (!token || isTokenExpired(token)) {
      clearAdminToken();
      setIsLoading(false);
      return;
    }

    // Décode les infos de l'admin directement depuis le JWT
    const payload = decodeJwtPayload(token);

    if (payload?.role !== "ADMIN") {
      // Token présent mais pas admin → nettoyage sécurité
      clearAdminToken();
      setIsLoading(false);
      return;
    }

    setAdminUser({ id: payload.sub, email: payload.email, role: payload.role });
    setIsLoading(false);
  }, []);

  /**
   * Connexion admin.
   * Appelle POST /admin/login, stocke le token, lit le payload.
   */
  const login = useCallback(async (credentials) => {
    const { accessToken } = await apiAdminLogin(credentials);
    const payload = decodeJwtPayload(accessToken);

    if (payload?.role !== "ADMIN") {
      throw new Error("Accès refusé : compte non administrateur.");
    }

    saveAdminToken(accessToken);
    const user = { id: payload.sub, email: payload.email, role: payload.role };
    setAdminUser(user);
    return user;
  }, []);

  /**
   * Déconnexion admin.
   * Appelle POST /admin/logout, efface le token local.
   */
  const logout = useCallback(async () => {
    await apiAdminLogout();
    clearAdminToken();
    setAdminUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ adminUser, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth doit être utilisé dans un AdminAuthProvider");
  }
  return ctx;
}
