import apiClient from "./client";

/**
 * POST /reviews - l'utilisateur laisse un avis après une transaction conclue
 * (spec §5.4). Un seul avis par (auteur, conversation).
 */
export async function createReview(payload) {
  const { data } = await apiClient.post("/reviews", payload);
  return data;
}
