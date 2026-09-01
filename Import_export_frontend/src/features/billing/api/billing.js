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

const invoicesApi = createResourceApi("invoices", mockInvoices);

export const getInvoices = invoicesApi.getAll;
export const getInvoiceById = invoicesApi.getById;

function normalizeStatus(data = {}) {
  const usedMessages = Number(
    data.usedMessages ?? data.messages_used ?? data.messages_utilises ?? data.usedChats ?? data.chats_utilises ?? 0
  );
  const maxMessages = Number(
    data.maxMessages ?? data.messages_limit ?? data.messages_gratuits ?? data.maxChats ?? data.chats_gratuits ?? 50
  );
  const status = String(data.status ?? data.statut ?? "GRATUIT");
  const isPremium = Boolean(data.isPremium ?? data.is_premium ?? status === "ABONNE");
  const isPayPerUse = status === "PAIEMENT_USAGE";

  return {
    usedMessages,
    maxMessages,
    // Aliases temporaires pour les composants existants.
    usedChats: usedMessages,
    maxChats: maxMessages,
    remaining: Math.max(0, maxMessages - usedMessages),
    status,
    isPremium,
    isPayPerUse,
    isUnlimited: isPremium || isPayPerUse,
    isBlocked: !isPremium && !isPayPerUse && usedMessages >= maxMessages,
    usageSpending: Number(data.usageSpending ?? data.depense_usage ?? 0),
    recommendationSubscription: Boolean(
      data.recommendationSubscription ?? data.recommendation_abonnement
    ),
    stripeCustomerId: data.stripeCustomerId ?? data.stripe_customer_id ?? null,
    stripeSubscriptionId:
      data.stripeSubscriptionId ?? data.stripe_subscription_id ?? null,
  };
}

async function getRealBillingStatus() {
  const { data } = await apiClient.get("/billing/status");
  return normalizeStatus(data);
}

function resolveMockBillingCycle() {
  const today = new Date();
  const renewal = new Date(mockSubscription.renewalDate);
  if (today < renewal) return;

  if (mockSubscription.cancelAtPeriodEnd) {
    const freePlan = mockPlans.find((p) => p.id === "free");
    mockSubscription.planId = freePlan.id;
    mockSubscription.planTitle = freePlan.title;
    mockSubscription.price = freePlan.price;
    mockSubscription.cancelAtPeriodEnd = false;
  }

  mockSubscription.status = "active";
  mockSubscription.startedAt = mockSubscription.renewalDate;
  const d = new Date(mockSubscription.renewalDate);
  d.setMonth(d.getMonth() + 1);
  mockSubscription.renewalDate = d.toISOString().slice(0, 10);
}

export async function getUsage() {
  if (USE_MOCKS) {
    await delay(150);
    resolveMockBillingCycle();
    return mockUsage;
  }

  const status = await getRealBillingStatus();
  return {
    usedChats: status.usedChats,
    maxChats: status.maxChats,
  };
}

// En mode API réelle, le backend est l'unique source de vérité du quota.
// Le backend incrémente messages_utilises pour CHAQUE message/document réel du plan gratuit.
// On ne ré-incrémente donc jamais le compteur côté frontend.
export async function incrementUsage() {
  if (USE_MOCKS) {
    await delay(100);
    resolveMockBillingCycle();
    if (mockSubscription.planId !== "premium" || mockSubscription.status !== "active") {
      mockUsage.usedChats += 1;
    }
    return mockUsage;
  }

  return getUsage();
}

export async function checkPaywallStatus() {
  if (USE_MOCKS) {
    await delay(100);
    resolveMockBillingCycle();
    const hasUnlimitedPlan =
      mockSubscription.planId === "premium" && mockSubscription.status === "active";
    const isPayPerUse = mockSubscription.planId === "pay-per-use";
    const isBlocked =
      !hasUnlimitedPlan && !isPayPerUse && mockUsage.usedChats >= mockUsage.maxChats;

    return {
      isBlocked,
      usage: mockUsage,
      isUnlimited: hasUnlimitedPlan || isPayPerUse,
      remaining: Math.max(0, mockUsage.maxChats - mockUsage.usedChats),
    };
  }

  const status = await getRealBillingStatus();
  return {
    isBlocked: status.isBlocked,
    usage: {
      usedChats: status.usedChats,
      maxChats: status.maxChats,
    },
    isUnlimited: status.isUnlimited,
    remaining: status.remaining,
  };
}

export async function getSmartRecommendation() {
  if (USE_MOCKS) {
    await delay(100);
    const payPerUsePlan = mockPlans.find((p) => p.id === "pay-per-use");
    const premiumPlan = mockPlans.find((p) => p.id === "premium");
    if (!payPerUsePlan || !premiumPlan) return null;

    const estimatedPayPerUseCost = mockUsage.usedChats * payPerUsePlan.priceValue;
    const isPremiumCheaper = estimatedPayPerUseCost > premiumPlan.priceValue;
    const isRelevant =
      mockSubscription.planId !== "premium" || mockSubscription.status !== "active";

    if (!isPremiumCheaper || !isRelevant) return null;

    return {
      estimatedPayPerUseCost,
      premiumPrice: premiumPlan.priceValue,
      savings: estimatedPayPerUseCost - premiumPlan.priceValue,
      messageCount: mockUsage.usedChats,
    };
  }

  const status = await getRealBillingStatus();
  if (!status.recommendationSubscription || status.isPremium) return null;

  const premiumPlan = mockPlans.find((p) => p.id === "premium");
  const premiumPrice = premiumPlan?.priceValue ?? 29;

  return {
    estimatedPayPerUseCost: status.usageSpending,
    premiumPrice,
    savings: Math.max(0, status.usageSpending - premiumPrice),
    messageCount: status.usedChats,
  };
}

export async function getSubscription() {
  if (USE_MOCKS) {
    await delay(250);
    resolveMockBillingCycle();
    return mockSubscription;
  }

  const status = await getRealBillingStatus();

  let planId = "free";
  let planTitle = "Gratuit";
  let price = "0 €";

  if (status.isPremium) {
    planId = "premium";
    planTitle = "Premium";
    price = "29 € / mois";
  } else if (status.isPayPerUse) {
    planId = "pay-per-use";
    planTitle = "Paiement à l'usage";
    price = "Selon utilisation";
  }

  return {
    planId,
    planTitle,
    price,
    status: status.status,
    cancelAtPeriodEnd: false,
    renewalDate: null,
    stripeCustomerId: status.stripeCustomerId,
    stripeSubscriptionId: status.stripeSubscriptionId,
  };
}

export async function cancelSubscription() {
  if (USE_MOCKS) {
    await delay(400);
    mockSubscription.cancelAtPeriodEnd = true;
    return mockSubscription;
  }
  throw new Error("La résiliation automatique n'est pas encore exposée par le backend.");
}

export async function reactivateSubscription() {
  if (USE_MOCKS) {
    await delay(300);
    mockSubscription.cancelAtPeriodEnd = false;
    return mockSubscription;
  }
  throw new Error("La réactivation automatique n'est pas encore exposée par le backend.");
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
  return getSubscription();
}

// Moyens de paiement Stripe réels. Les numéros de carte/CVC ne transitent
// jamais par notre API : Stripe Elements les envoie directement à Stripe.
export async function createSetupIntent() {
  if (USE_MOCKS) {
    await delay(150);
    return { clientSecret: "mock_setup_secret" };
  }
  try {
    const { data } = await apiClient.post("/billing/setup-intent");
    return { clientSecret: data.clientSecret ?? data.client_secret };
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Impossible de préparer l'enregistrement de la carte.");
  }
}

export async function getPaymentMethods() {
  if (USE_MOCKS) {
    await delay(250);
    return mockPaymentMethods;
  }
  try {
    const { data } = await apiClient.get("/billing/payment-methods");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Impossible de charger les moyens de paiement.");
  }
}

// En mode réel, l'attachement est effectué automatiquement par le SetupIntent
// Stripe confirmé depuis AddCardForm. Cette fonction est gardée pour les mocks.
export async function addPaymentMethod(method) {
  if (USE_MOCKS) {
    await delay(400);
    const newMethod = { ...method, id: `pm-${Date.now()}`, isDefault: false };
    mockPaymentMethods.push(newMethod);
    return newMethod;
  }
  return method;
}

export async function removePaymentMethod(id) {
  if (USE_MOCKS) {
    await delay(300);
    const index = mockPaymentMethods.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Moyen de paiement introuvable");
    mockPaymentMethods.splice(index, 1);
    return { success: true };
  }
  try {
    const { data } = await apiClient.delete(`/billing/payment-methods/${id}`);
    return data;
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Impossible de supprimer ce moyen de paiement.");
  }
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
  try {
    const { data } = await apiClient.post(`/billing/payment-methods/${id}/default`);
    return data;
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Impossible de définir ce moyen de paiement par défaut.");
  }
}
