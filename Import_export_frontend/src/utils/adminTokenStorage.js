const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_INFO_KEY = "admin_info";

/**
 * Stockage du JWT admin séparé de celui des Utilisateurs (spec §4).
 * L'identité admin est totalement distincte : elle vit dans son propre
 * localStorage et n'est jamais mélangée au token utilisateur.
 */
export function saveAdminToken(token, admin) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (admin) localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(admin));
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminInfo() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_INFO_KEY));
  } catch {
    return null;
  }
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_INFO_KEY);
}
