import adminClient from "./adminClient";

/**
 * GET /admin/companies
 * Retourne la liste paginée + filtrée des entreprises.
 *
 * @param {Object} filters
 * @param {string} [filters.status]
 * @param {string} [filters.country]
 * @param {string} [filters.sector]
 * @param {string} [filters.date_from]
 * @param {string} [filters.date_to]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 *
 * @returns {{ data, page, limit, total }}
 */
export async function getAdminCompanies(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const { data } = await adminClient.get("/admin/companies", { params });
  return data;
}

/**
 * GET /admin/companies/pending
 * Retourne les entreprises en attente de validation.
 *
 * @param {number} [page]
 * @param {number} [limit]
 */
export async function getPendingCompanies(page = 1, limit = 10) {
  const { data } = await adminClient.get("/admin/companies/pending", {
    params: { page, limit },
  });
  return data;
}

/**
 * GET /admin/companies/:id/documents
 * Retourne les documents KYB d'une entreprise.
 */
export async function getCompanyDocuments(companyId) {
  const { data } = await adminClient.get(`/admin/companies/${companyId}/documents`);
  return data;
}

/**
 * POST /admin/companies/:id/validate
 * Valide une entreprise.
 *
 * @param {string} companyId
 * @param {Object} [body]
 * @param {string} [body.motif]
 */
export async function validateCompany(companyId, body = {}) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/validate`, body);
  return data;
}

/**
 * POST /admin/companies/:id/reject
 * Rejette une entreprise.
 *
 * @param {string} companyId
 * @param {Object} [body]
 * @param {string} [body.motif]
 */
export async function rejectCompany(companyId, body = {}) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/reject`, body);
  return data;
}

/**
 * POST /admin/companies/:id/kyb-verify
 * Lance ou met à jour la vérification KYB.
 *
 * @param {string} companyId
 * @param {Object} body
 * @param {string} body.status              - EN_ATTENTE | VALIDE | REJETE
 * @param {Array}  body.checklistItems
 */
export async function kybVerify(companyId, body) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/kyb-verify`, body);
  return data;
}

/**
 * POST /admin/companies/:id/badges
 * Attribue un badge à une entreprise.
 *
 * @param {string} companyId
 * @param {Object} body
 * @param {string} body.badgeType
 */
export async function assignBadge(companyId, body) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/badges`, body);
  return data;
}

/**
 * GET /companies/:id/reviews/summary
 * Retourne la note moyenne et le nombre d'avis d'une entreprise.
 * Endpoint public (pas de guard admin).
 *
 * @param {string} companyId
 * @returns {{ companyId, averageRating: number|null, reviewCount: number }}
 */
export async function getCompanyReviewsSummary(companyId) {
  const { data } = await adminClient.get(`/companies/${companyId}/reviews/summary`);
  return data;
}
