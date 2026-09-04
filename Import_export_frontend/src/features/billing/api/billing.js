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

const invoicesApi = createResourceApi("billing/invoices", mockInvoices);

export const getInvoices = invoicesApi.getAll;
export const getInvoiceById = invoicesApi.getById;

export async function getInvoicePdfUrl(invoiceId) {
  const { data } = await apiClient.get(`/billing/invoices/${invoiceId}/pdf`);
  return data;
}

export async function createSubscriptionCheckout(successUrl, cancelUrl) {
  const { data } = await apiClient.post("/billing/subscribe", {
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return data;
}

function normalizeStatus(data = {}) {
  const usedMessages = Number(
    data.usedMessages ??
      data.messages_used ??
      data.messages_utilises ??
      data.usedChats ??
      data.chats_utilises ??
      0
  );

  const maxMessages = Number(
    data.maxMessages ??
      data.messages_limit ??
      data.messages_gratuits ??
      data.maxChats ??
      data.chats_gratuits ??
      50
  );

  const rawStatus = String(data.status ?? data.statut ?? "GRATUIT").trim().toUpperCase();
  const normalizedStatus = rawStatus || "GRATUIT";

  const premiumFlag = Boolean(data.isPremium ?? data.is_premium);
  const isPremium =
    premiumFlag ||
    normalizedStatus === "ABONNE" ||
    normalizedStatus === "PREMIUM";

  const isPayPerUse =
    !isPremium && (
      normalizedStatus === "PAIEMENT_USAGE" ||
      normalizedStatus === "PAY_PER_USE" ||
      normalizedStatus === "PAY-PER-USE" ||
      normalizedStatus === "USAGE"
    );

  return {
    usedMessages,
    maxMessages,

    // Compatibilité avec les anciens composants
    usedChats: usedMessages,
    maxChats: maxMessages,

    remaining: Math.max(0, maxMessages - usedMessages),

    status: normalizedStatus,

    isPremium,
    isPayPerUse,

    isUnlimited: isPremium || isPayPerUse,

    isBlocked:
      !isPremium &&
      !isPayPerUse &&
      usedMessages >= maxMessages,

        // Dépense RÉELLE déjà débitée via Stripe (historique de paiement).
    usageSpending: Number(
      data.usageSpending ??
        data.depense_usage ??
        0
    ),

    // Projection : combien coûterait le paiement à l'usage AU RYTHME ACTUEL
    // (nombre de messages × prix par message). C'est CETTE valeur qui doit
    // être comparée au nombre de messages dans la bannière, pas `usageSpending`
    // qui peut inclure des paiements sans rapport (abonnement, etc.).
    usageCostEstimate: Number(
      data.usageCostEstimate ??
        data.usage_cost_estimate ??
        data.cout_usage_estime ??
        0
    ),

    recommendationSubscription: Boolean(
      data.recommendationSubscription ??
        data.recommendation_abonnement
    ),

    stripeCustomerId:
      data.stripeCustomerId ??
      data.stripe_customer_id ??
      null,

    stripeSubscriptionId:
      data.stripeSubscriptionId ??
      data.stripe_subscription_id ??
      null,

    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd ?? data.cancel_at_period_end),
    renewalDate: data.renewalDate ?? data.renewal_date ?? null,
  };
}

export async function confirmPayment(paymentIntentId) {
  if (USE_MOCKS) {
    await delay(300);
    return { statut: "PAIEMENT_USAGE", is_premium: false, pay_per_use: true };
  }
  try {
    const { data } = await apiClient.post("/billing/confirm-payment", {
      payment_intent_id: paymentIntentId,
    });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.detail || "Le paiement a réussi mais n'a pas pu être appliqué."
    );
  }
}

export async function getRealBillingStatus() {
  // Cache-busting explicite : certains navigateurs/proxies mettent en
  // cache les réponses GET par défaut. On force une requête fraîche à
  // chaque appel, sinon un paiement tout juste confirmé peut sembler
  // "ne rien changer" alors que le backend est déjà à jour.
  const { data } = await apiClient.get("/billing/status", {
    params: { _: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return normalizeStatus(data);
}

// Le webhook Stripe met à jour le plan de façon ASYNCHRONE — il arrive
// après la confirmation du paiement, avec un délai variable (souvent
// moins d'une seconde, parfois quelques secondes). On ne peut donc pas
// se contenter de relire le statut juste après avoir payé : il faut
// réessayer plusieurs fois jusqu'à ce que le changement soit visible.
export async function waitForPlanUpdate(expectedPlanId, { attempts = 8, delayMs = 800 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const status = await getRealBillingStatus();
    const matches =
      (expectedPlanId === "premium" && status.isPremium) ||
      (expectedPlanId === "pay-per-use" && status.isPayPerUse);
    if (matches) return status;
    await delay(delayMs);
  }
  // Le webhook n'est pas encore passé après ~6s : on abandonne l'attente
  // active, mais on renvoie quand même le dernier statut connu — le plan
  // finira par se mettre à jour au prochain chargement de la page.
  return getRealBillingStatus();
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
    // Projection cohérente avec messageCount, pas la dépense brute cumulée.
    estimatedPayPerUseCost: status.usageCostEstimate,
    premiumPrice,
    savings: Math.max(0, status.usageCostEstimate - premiumPrice),
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

  const isPremiumStatus =
    status.isPremium ||
    status.status === "ABONNE" ||
    status.status === "PREMIUM";

  const isUsageStatus =
    status.isPayPerUse ||
    status.status === "PAIEMENT_USAGE" ||
    status.status === "PAY_PER_USE" ||
    status.status === "PAY-PER-USE" ||
    status.status === "USAGE";

  if (isPremiumStatus) {
    planId = "premium";
    planTitle = "Premium";
    price = "29 € / mois";
  } else if (isUsageStatus) {
    planId = "pay-per-use";
    planTitle = "Paiement à l'usage";
    price = "Selon utilisation";
  }

  return {
    planId,
    planTitle,
    price,
    status: status.status,
    cancelAtPeriodEnd: Boolean(status.cancelAtPeriodEnd),
    renewalDate: status.renewalDate
      ? new Date(status.renewalDate * 1000).toISOString().slice(0, 10)
      : null,
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
  try {
    await apiClient.post("/billing/cancel-subscription");
    return getSubscription();
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Impossible de résilier l'abonnement.");
  }
}

export async function reactivateSubscription() {
  if (USE_MOCKS) {
    await delay(300);
    mockSubscription.cancelAtPeriodEnd = false;
    return mockSubscription;
  }
  try {
    await apiClient.post("/billing/reactivate-subscription");
    return getSubscription();
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Impossible d'annuler la résiliation.");
  }
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