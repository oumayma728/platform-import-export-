import adminClient from "./adminClient";

/**
 * POST /admin/login
 * Authentifie un administrateur.
 * Retourne { accessToken } — le refresh token est stocké en cookie HttpOnly.
 */
export async function adminLogin({ email, password }) {
  const { data } = await adminClient.post("/admin/login", { email, password });
  return data; // { accessToken }
}

/**
 * POST /admin/logout
 * Révoque le refresh token admin et efface le cookie.
 */
export async function adminLogout() {
  try {
    await adminClient.post("/admin/logout");
  } catch {
    // Même si la requête échoue, on nettoie localement
  }
}
