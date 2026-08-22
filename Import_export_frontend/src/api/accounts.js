import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";
import { mockAccounts } from "../mocks/accounts.mock";

/**
 * GET /accounts/:userId — infos publiques du compte propriétaire d'une
 * annonce (entreprise, rôle importateur/exportateur, pays, secteur,
 * certifications). Utilisé pour les afficher avant/pendant la mise en
 * contact, plutôt qu'un simple libellé générique "Vendeur".
 */
export async function getPublicAccount(userId) {
  if (!userId) return null;

  if (USE_MOCKS) {
    await delay(200);
    return mockAccounts[userId] || null;
  }

  try {
    const { data } = await apiClient.get(`/accounts/${userId}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw new Error(
      err.response?.data?.message || "Impossible de charger les informations du compte."
    );
  }
}
