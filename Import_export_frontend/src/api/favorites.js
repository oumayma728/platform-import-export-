import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";
import { mockFavorites } from "../mocks/favorites.mock";
import { getListings } from "./listings";
const CURRENT_USER_ID = "user_42";

export async function getFavoriteListings() {
  const favorites =
    await getFavorites();

  const listings =
    await getListings();

  return listings.filter(
    (listing) =>
      favorites.some(
        (fav) =>
          fav.listingId === listing.id
      )
  );
}
// Toutes les annonces mises en favoris par l'utilisateur courant.
export async function getFavorites() {
  if (USE_MOCKS) {
    await delay(200);
    return mockFavorites.filter((f) => f.userId === CURRENT_USER_ID);
  }
  const { data } = await apiClient.get("/favorites");
  return data;
}

// Vérifie si une annonce est déjà en favoris (utilisé au chargement du détail).
export async function isListingFavorited(listingId) {
  if (USE_MOCKS) {
    await delay(150);
    return mockFavorites.some(
      (f) => f.userId === CURRENT_USER_ID && f.listingId === listingId
    );
  }
  const { data } = await apiClient.get(`/favorites/check/${listingId}`);
  return Boolean(data?.isFavorite);
}

export async function addFavorite(listingId) {
  if (USE_MOCKS) {
    await delay(300);
    const exists = mockFavorites.some(
      (f) => f.userId === CURRENT_USER_ID && f.listingId === listingId
    );
    if (!exists) {
      mockFavorites.push({
        id: `fav-${Date.now()}`,
        userId: CURRENT_USER_ID,
        listingId,
        createdAt: new Date().toISOString(),
      });
    }
    return { success: true, isFavorite: true };
  }
  const { data } = await apiClient.post("/favorites", { listingId });
  return data;
}

export async function removeFavorite(listingId) {
  if (USE_MOCKS) {
    await delay(300);
    const index = mockFavorites.findIndex(
      (f) => f.userId === CURRENT_USER_ID && f.listingId === listingId
    );
    if (index !== -1) mockFavorites.splice(index, 1);
    return { success: true, isFavorite: false };
  }
  await apiClient.delete(`/favorites/${listingId}`);
  return { success: true, isFavorite: false };
}

// Bascule l'état favori/non-favori pour une annonce donnée.
export async function toggleFavorite(listingId, isCurrentlyFavorited) {
  return isCurrentlyFavorited
    ? removeFavorite(listingId)
    : addFavorite(listingId);
}


export { CURRENT_USER_ID };
