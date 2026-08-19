import adminClient from "./adminClient";

/**
 * GET /admin/moderation-history
 * Retourne la liste paginée des actions de modération pour une entité donnée.
 *
 * @param {string} entityType - 'COMPANY' | 'USER'
 * @param {string} entityId   - UUID de l'entité
 * @param {number} [page=1]   - Numéro de page (1-indexé)
 * @param {number} [limit=10] - Nombre d'éléments par page
 *
 * @returns {{ data: Array, page: number, limit: number, total: number }}
 */
export async function getModerationHistory(entityType, entityId, page = 1, limit = 10) {
  const { data } = await adminClient.get("/admin/moderation-history", {
    params: {
      entity_type: entityType,
      entity_id: entityId,
      page,
      limit,
    },
  });
  return data;
}
