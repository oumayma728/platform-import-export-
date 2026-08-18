import adminClient from "./adminClient";

/**
 * GET /admin/users
 * Retourne la liste paginée + filtrée des utilisateurs avec statusCounts.
 *
 * @param {Object} filters
 * @param {string} [filters.status]     - EN_ATTENTE_VALIDATION | VALIDE | REJETE | SUSPENDU
 * @param {string} [filters.country]    - Pays (via company)
 * @param {string} [filters.sector]     - Secteur (via company)
 * @param {string} [filters.date_from]  - ISO date (ex: "2026-01-01")
 * @param {string} [filters.date_to]    - ISO date (ex: "2026-12-31")
 * @param {number} [filters.page]       - Page (défaut: 1)
 * @param {number} [filters.limit]      - Résultats par page (défaut: 10)
 *
 * @returns {{ data, statusCounts, page, limit, total }}
 */
export async function getAdminUsers(filters = {}) {
  // Nettoyer les valeurs vides pour éviter ?status=&country= dans l'URL
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const { data } = await adminClient.get("/admin/users", { params });
  return data;
}

/**
 * POST /admin/users/:id/suspend
 * Suspend un utilisateur et enregistre l'action dans l'historique.
 *
 * @param {string} userId
 * @param {Object} body
 * @param {string} [body.motif]                   - Raison de la suspension
 * @param {number} [body.suspensionDurationDays]  - Durée en jours
 */
export async function suspendUser(userId, body = {}) {
  const { data } = await adminClient.post(`/admin/users/${userId}/suspend`, body);
  return data;
}
