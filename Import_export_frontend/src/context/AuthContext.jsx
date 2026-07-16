import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerUser } from "../api/auth";
import { saveToken, getToken, clearToken, isTokenExpired } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      // Token périmé : inutile d'appeler l'API, on nettoie directement et
      // on considère l'utilisateur déconnecté.
      clearToken();
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * @param {object} credentials
   * @param {boolean} remember - true = reste connecté après fermeture du
   *   navigateur (localStorage), false = session le temps de l'onglet
   *   (sessionStorage). Correspond à une case "Se souvenir de moi".
   */
  async function login(credentials, remember = true) {
    const { user: loggedInUser, token } = await loginUser(credentials);
    saveToken(token, remember);
    setUser(loggedInUser);
    return loggedInUser;
  }

  /**
   * L'inscription connecte directement l'utilisateur (le backend renvoie
   * un token comme pour le login), pour ne pas lui demander de se
   * reconnecter juste après avoir créé son compte.
   */
  async function register(payload, remember = true) {
    const { user: registeredUser, token } = await registerUser(payload);
    saveToken(token, remember);
    setUser(registeredUser);
    return registeredUser;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  function updateUser(patch) {
    setUser((prev) => ({ ...prev, ...patch }));
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
