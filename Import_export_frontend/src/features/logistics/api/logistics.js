import apiClient from "../../../api/client";

/**
 * Convertir une somme d'une devise à une autre
 * @param {number} amount - Montant à convertir
 * @param {string} fromCurrency - Devise source (ex: "USD")
 * @param {string} toCurrency - Devise cible (ex: "EUR")
 * @returns {Promise} Données de conversion
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await apiClient.get("/currency/convert", {
      params: {
        amount,
        from: fromCurrency,
        to: toCurrency,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur conversion devise:", error.message);
    throw new Error("Impossible de convertir la devise");
  }
}

/**
 * Estimer les coûts logistiques entre deux pays
 * @param {string} origin - Code ISO du pays d'origine (ex: "FR")
 * @param {string} destination - Code ISO du pays de destination (ex: "TN")
 * @returns {Promise} Données logistiques (distance, coût, délai)
 */
export async function estimateLogistics(origin, destination) {
  try {
    const response = await apiClient.get("/logistics/estimate", {
      params: {
        from: origin,
        to: destination,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur estimation logistique:", error.message);
    throw new Error("Impossible d'estimer la logistique");
  }
}