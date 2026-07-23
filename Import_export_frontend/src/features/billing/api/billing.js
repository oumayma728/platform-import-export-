import { createResourceApi } from "../../../api/createResourceApi";
import apiClient, { USE_MOCKS } from "../../../api/client";
import { delay } from "../../../utils/delay";
import {
  mockInvoices,
  mockSubscription,
  mockPaymentMethods,
  mockUsage,
  mockPlans,
} from "../mocks/billing.mock";

// Ressource générique "factures" — réutilise le même client CRUD mocké/réel
// que les autres modules (annonces, conversations...).
const invoicesApi = createResourceApi("invoices", mockInvoices);

export const getInvoices = invoicesApi.getAll;
export const getInvoiceById = invoicesApi.getById;

// L'abonnement et les moyens de paiement ne rentrent pas dans le CRUD
// générique (un seul abonnement actif, opérations dédiées type "annuler",
// "changer de plan", "définir par défaut"), donc fonctions spécifiques ici —
// même schéma que sendMessage/updateConversationStatus dans api/messages.js.

/**
 * Simule ce que ferait un job de facturation récurrent côté backend
 * (Stripe webhook + cron), qu'on n'a pas ici puisque tout est mocké : fait
 * "avancer" l'abonnement jusqu'à aujourd'hui dès qu'on lit son état.
 *
 * Règle : tant que la date de renouvellement n'est pas dépassée, rien ne
 * bouge (le cycle payé est en cours, les messages envoyés sous Premium ne
 * doivent jamais consommer le quota Gratuit — voir incrementUsage). Une
 * fois la date de renouvellement dépassée :
 *  - si l'utilisateur a résilié (cancelAtPeriodEnd) → retour automatique
 *    au plan Gratuit, avec son propre quota qui repart de zéro ;
 *  - sinon → l'abonnement se renouvelle simplement pour un nouveau mois.
 * Dans les deux cas, le compteur de messages du cycle précédent est remis
 * à zéro : chaque période (Gratuit ou payante) a son propre quota.
 */
function resolveBillingCycle() {
  const today = new Date();
  const renewal = new Date(mockSubscription.renewalDate);
  if (today < renewal) return; // cycle en cours, rien à résoudre

  if (mockSubscription.cancelAtPeriodEnd) {
    const freePlan = mockPlans.find((p) => p.id === "free");
    mockSubscription.planId = freePlan.id;
    mockSubscription.planTitle = freePlan.title;
    mockSubscription.price = freePlan.price;
    mockSubscription.cancelAtPeriodEnd = false;
  }

  mockSubscription.status = "active";
  mockSubscription.startedAt = mockSubscription.renewalDate;
  mockSubscription.renewalDate = addOneMonth(mockSubscription.renewalDate);
  mockUsage.usedChats = 0;
}

function addOneMonth(isoDate) {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getUsage() {
  if (USE_MOCKS) {
    await delay(150);
    resolveBillingCycle();
    return mockUsage;
  }
  const { data } = await apiClient.get("/billing/usage");
  return data;
}

// Consomme un crédit de message — appelé à chaque envoi de message réussi.
// Ne fait rien si l'utilisateur a un abonnement actif illimité (Premium).
export async function incrementUsage() {
  if (USE_MOCKS) {
    await delay(100);
    resolveBillingCycle();
    if (mockSubscription.planId !== "premium" || mockSubscription.status !== "active") {
      mockUsage.usedChats += 1;
    }
    return mockUsage;
  }
  const { data } = await apiClient.post("/billing/increment-usage");
  return data;
}

// Un seul point de vérité pour savoir si l'envoi de messages doit être
// bloqué : plan gratuit + crédits épuisés + pas d'abonnement payant actif.
export async function checkPaywallStatus() {
  if (USE_MOCKS) {
    await delay(100);
    resolveBillingCycle();
    const hasUnlimitedPlan = mockSubscription.planId === "premium" && mockSubscription.status === "active";
    const isPayPerUse = mockSubscription.planId === "pay-per-use";
    const isBlocked = !hasUnlimitedPlan && !isPayPerUse && mockUsage.usedChats >= mockUsage.maxChats;
    return {
      isBlocked,
      usage: mockUsage,
      isUnlimited: hasUnlimitedPlan || isPayPerUse,
      remaining: Math.max(0, mockUsage.maxChats - mockUsage.usedChats),
    };
  }
  try {
    const { data } = await apiClient.post("/billing/check-paywall");
    return data;
  } catch {
    return { isBlocked: false, usage: { usedChats: 0, maxChats: 50 }, isUnlimited: false, remaining: 50 };
  }
}

// Notification intelligente : si le coût cumulé du paiement à l'usage
// dépasse le prix de l'abonnement Premium, on le signale à l'utilisateur.
export async function getSmartRecommendation() {
  if (USE_MOCKS) {
    await delay(100);
    const payPerUsePlan = mockPlans.find((p) => p.id === "pay-per-use");
    const premiumPlan = mockPlans.find((p) => p.id === "premium");
    if (!payPerUsePlan || !premiumPlan) return null;

    const estimatedPayPerUseCost = mockUsage.usedChats * payPerUsePlan.priceValue;
    const isPremiumCheaper = estimatedPayPerUseCost > premiumPlan.priceValue;
    const isRelevant = mockSubscription.planId !== "premium" || mockSubscription.status !== "active";

    if (!isPremiumCheaper || !isRelevant) return null;

    return {
      estimatedPayPerUseCost,
      premiumPrice: premiumPlan.priceValue,
      savings: estimatedPayPerUseCost - premiumPlan.priceValue,
      messageCount: mockUsage.usedChats,
    };
  }
  return null;
}

export async function getSubscription() {
  if (USE_MOCKS) {
    await delay(250);
    resolveBillingCycle();
    return mockSubscription;
  }
  const { data } = await apiClient.get("/billing/subscription");
  return data;
}

// Résilie l'abonnement PAYANT en cours, sans couper l'accès immédiatement :
// l'utilisateur garde son plan (ex: Premium illimité) jusqu'à la date de
// renouvellement déjà réglée, puis le compte repasse automatiquement au
// plan Gratuit à ce moment-là (voir resolveBillingCycle). C'est le
// comportement que promet déjà le texte de confirmation côté UI.
export async function cancelSubscription() {
  if (USE_MOCKS) {
    await delay(400);
    mockSubscription.cancelAtPeriodEnd = true;
    return mockSubscription;
  }
  const { data } = await apiClient.post("/billing/cancel-subscription");
  return data;
}

export async function reactivateSubscription() {
  if (USE_MOCKS) {
    await delay(300);
    mockSubscription.cancelAtPeriodEnd = false;
    return mockSubscription;
  }
  const { data } = await apiClient.post("/billing/reactivate-subscription");
  return data;
}

export async function changePlan(planId) {
  if (USE_MOCKS) {
    await delay(400);
    const plan = mockPlans.find((p) => p.id === planId);
    if (!plan) throw new Error("Offre introuvable");
    mockSubscription.planId = plan.id;
    mockSubscription.planTitle = plan.title;
    mockSubscription.price = plan.price;
    mockSubscription.status = "active";
    if (!mockSubscription.usedPlanIds.includes(plan.id)) {
      mockSubscription.usedPlanIds.push(plan.id);
    }
    return mockSubscription;
  }
  const { data } = await apiClient.post("/billing/change-plan", { planId });
  return data;
}

export async function getPaymentMethods() {
  if (USE_MOCKS) {
    await delay(250);
    return mockPaymentMethods;
  }
  const { data } = await apiClient.get("/billing/payment-methods");
  return data;
}

export async function addPaymentMethod(method) {
  if (USE_MOCKS) {
    await delay(400);
    const newMethod = { ...method, id: `pm-${Date.now()}`, isDefault: false };
    mockPaymentMethods.push(newMethod);
    return newMethod;
  }
  const { data } = await apiClient.post("/billing/payment-methods", method);
  return data;
}

export async function removePaymentMethod(id) {
  if (USE_MOCKS) {
    await delay(300);
    const index = mockPaymentMethods.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Moyen de paiement introuvable");
    mockPaymentMethods.splice(index, 1);
    return { success: true };
  }
  const { data } = await apiClient.delete(`/billing/payment-methods/${id}`);
  return data;
}

export async function setDefaultPaymentMethod(id) {
  if (USE_MOCKS) {
    await delay(300);
    mockPaymentMethods.forEach((m) => {
      m.isDefault = m.id === id;
    });
    mockSubscription.defaultPaymentMethodId = id;
    return mockPaymentMethods;
  }
  const { data } = await apiClient.put(`/billing/payment-methods/${id}/default`);
  return data;
}
