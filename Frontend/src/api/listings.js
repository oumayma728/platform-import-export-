import { createResourceApi } from "./createResourceApi";
import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";
import { mockListings } from "../mocks/listings.mock";

const CURRENT_USER_ID = "user_42";

function filterMock(data, { country, category, type, price, certifications, q } = {}) {
  const normalizedQuery = q?.trim().toLowerCase();

  return data
    .filter((l) => l.status !== "suspended" && l.status !== "closed")
    .filter(
      (l) =>
        (!country || l.country === country) &&
        (!category || l.category === category) &&
        (!type || l.type === type) &&
        (!price || (l.price >= price.min && l.price <= price.max)) &&
        // "au moins une" des certifications cochées, pas "toutes" — sinon
        // le filtre serait presque toujours vide.
        (!certifications ||
          certifications.length === 0 ||
          certifications.some((cert) => l.certifications?.includes(cert))) &&
        // Recherche textuelle libre : produit, catégorie, pays, certifications
        (!normalizedQuery ||
          [l.product, l.category, l.country, ...(l.certifications || [])]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(normalizedQuery)))
    );
}

const listingsApi = createResourceApi("listings", mockListings, { filterMock });

// Alias explicite pour un code appelant plus lisible dans les pages
export const getListings = listingsApi.getAll;

/**
 * GET /listings/:id — récupère le détail d'une annonce.
 * Implémentation explicite (plutôt que le simple alias générique) pour
 * gérer proprement le cas "annonce introuvable" (404) et normaliser la
 * forme de la réponse, certains backends renvoyant `{ listing: {...} }`
 * plutôt que l'objet directement.
 */
export async function getListingById(id) {
  if (USE_MOCKS) {
    await delay(200);
    const listing = mockListings.find((entry) => entry.id === id);
    if (!listing) {
      throw new Error("Cette annonce n'existe pas ou a été supprimée.");
    }
    return listing;
  }

  try {
    const { data } = await apiClient.get(`/listings/${id}`);
    // Tolère les deux formes de réponse possibles côté backend
    return data?.listing ?? data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error("Cette annonce n'existe pas ou a été supprimée.");
    }
    throw new Error(
      err.response?.data?.message || "Impossible de charger cette annonce pour le moment."
    );
  }
}

export async function createListing(payload) {
  const created = await listingsApi.create({
    ...payload,
    ownerId: CURRENT_USER_ID,
    status: "active",
  });
  // Garde les mocks en mémoire synchronisés pour que "Mes annonces" et
  // le catalogue reflètent immédiatement la nouvelle annonce.
  mockListings.push(created);
  return created;
}

export async function updateListing(id, payload) {
  await delay(300);
  const index = mockListings.findIndex((l) => l.id === id);
  if (index === -1) throw new Error("Annonce introuvable");
  mockListings[index] = { ...mockListings[index], ...payload };
  return mockListings[index];
}

/**
 * DELETE /listings/:id — suppression définitive.
 * Implémentation explicite (plutôt que le simple alias `listingsApi.remove`)
 * car le client générique ne connaît pas notre tableau `mockListings` : sans
 * ça, l'annonce "supprimée" resterait visible après un refetch en mode mock.
 */
export async function deleteListing(id) {
  if (USE_MOCKS) {
    await delay(300);
    const index = mockListings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error("Annonce introuvable");
    mockListings.splice(index, 1);
    return { success: true };
  }

  try {
    await apiClient.delete(`/listings/${id}`);
    return { success: true };
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Impossible de supprimer cette annonce pour le moment."
    );
  }
}

// Toutes les annonces du propriétaire, quel que soit leur statut
// (contrairement au catalogue public qui masque suspendues/clôturées).
export async function getMyListings() {
  await delay(300);
  return mockListings.filter((l) => l.ownerId === CURRENT_USER_ID);
}
