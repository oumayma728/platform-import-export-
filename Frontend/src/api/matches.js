import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";
import { mockMatches, mockListings } from "../mocks/listings.mock";

/**
 * GET /matching-results — récupère les correspondances proposées par l'agent IA pour
 * les annonces de l'utilisateur courant, triées par score de pertinence
 * décroissant.
 *
 * Params de filtrage optionnels envoyés en query string :
 *  - minScore : score minimum (0-100)
 *  - listingId : ne montrer que les correspondances liées à une annonce précise
 */
export async function getMatches(params = {}) {
  if (USE_MOCKS) {
    await delay(350);

    const { minScore, listingId } = params;

    const enriched = mockMatches
      .map((match) => ({
        ...match,
        listing: mockListings.find((l) => l.id === match.listingId) || null,
        // La vraie annonce du partenaire (son offre/demande), distincte de
        // votre propre annonce référencée par `listingId` — c'est celle-ci
        // qu'il faut afficher/ouvrir quand on veut "voir l'annonce" du match,
        // pas la vôtre.
        counterpartListing:
          mockListings.find((l) => l.id === match.counterpartListingId) || null,
      }))
      .filter(
        (match) =>
          (!minScore || match.matchScore >= minScore) &&
          (!listingId || match.listingId === listingId)
      );

    // Tri par score de pertinence décroissant — c'est l'agent IA qui décide
    // du classement, on ne fait que refléter ce tri côté front.
    return enriched.sort((a, b) => b.matchScore - a.matchScore);
  }

  const { data } = await apiClient.get("/matching-results", { params });
  return data;
}