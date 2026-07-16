const TOKEN_KEY = "auth_token";

/**
 * Enregistre le token d'authentification.
 * @param {string} token
 * @param {boolean} remember - true = localStorage (persiste après fermeture
 *   du navigateur), false = sessionStorage (effacé à la fermeture de l'onglet)
 */
export function saveToken(token, remember = true) {
  clearToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

/**
 * Récupère le token, peu importe où il a été stocké (localStorage a la
 * priorité si les deux existent, ce qui ne devrait normalement pas arriver
 * puisque saveToken() nettoie l'autre storage à chaque écriture).
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Décode la partie payload d'un JWT (sans vérifier la signature — ça,
 * c'est le rôle du backend). Sert uniquement à lire des infos côté client
 * comme la date d'expiration, pour éviter d'envoyer des requêtes inutiles
 * avec un token qu'on sait déjà périmé.
 */
export function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;
    const json = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * true si le token est un JWT expiré. Si ce n'est pas un JWT standard
 * (ex: un token mock comme "mock-token-123") ou qu'il n'a pas de claim
 * `exp`, on considère qu'on ne peut pas savoir — donc pas expiré, on
 * laisse le backend trancher au prochain appel (via l'intercepteur 401).
 */
export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}
