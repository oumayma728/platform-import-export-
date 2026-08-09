import { createContext, useContext, useState, useEffect } from "react";
import { getAdminToken, getAdminInfo, saveAdminToken, clearAdminToken } from "../../../utils/adminTokenStorage";
import { adminLogin, adminLogout, getAdminProfile } from "../api/admin";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getAdminProfile()
      .then((data) => {
        setAdmin(data);
        saveAdminToken(token, data);
      })
      .catch(() => clearAdminToken())
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email, password) {
    const { token, admin: loggedAdmin } = await adminLogin(email, password);
    saveAdminToken(token, loggedAdmin);
    setAdmin(loggedAdmin);
    return loggedAdmin;
  }

  function logout() {
    adminLogout().catch(() => {});
    clearAdminToken();
    setAdmin(null);
  }

  return (
    <AdminContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin doit être utilisé dans un AdminProvider");
  }
  return context;
}
