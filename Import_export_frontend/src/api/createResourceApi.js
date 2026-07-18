import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";

/**
 * Crée un client CRUD générique pour une ressource donnée.
 * Une seule implémentation, réutilisée par listings.js, matches.js, messages.js, billing.js...
 *
 * @param {string} resourcePath - ex: "listings", "matches", "conversations"
 * @param {Array} mockData - jeu de données mockées pour cette ressource
 * @param {object} options - hooks optionnels pour personnaliser le filtrage mock
 */
export function createResourceApi(resourcePath, mockData = [], options = {}) {
  const { filterMock } = options;

  return {
    async getAll(params = {}) {
      if (USE_MOCKS) {
        await delay();
        return filterMock ? filterMock(mockData, params) : mockData;
      }
      const { data } = await apiClient.get(`/${resourcePath}`, { params });
      return data;
    },

    async getById(id) {
      if (USE_MOCKS) {
        await delay(200);
        const item = mockData.find((entry) => entry.id === id);
        if (!item) throw new Error("Ressource introuvable");
        return item;
      }
      const { data } = await apiClient.get(`/${resourcePath}/${id}`);
      return data;
    },

    async create(payload) {
      if (USE_MOCKS) {
        await delay(400);
        return { ...payload, id: String(Date.now()) };
      }
      const { data } = await apiClient.post(`/${resourcePath}`, payload);
      return data;
    },

    async update(id, payload) {
      if (USE_MOCKS) {
        await delay(300);
        return { ...payload, id };
      }
      const { data } = await apiClient.put(`/${resourcePath}/${id}`, payload);
      return data;
    },

    async remove(id) {
      if (USE_MOCKS) {
        await delay(200);
        return { success: true };
      }
      await apiClient.delete(`/${resourcePath}/${id}`);
      return { success: true };
    },
  };
}
