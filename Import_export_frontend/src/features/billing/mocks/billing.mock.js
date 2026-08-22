export const mockUsage = {
  usedChats: 45,
  maxChats: 50,
};

// Abonnement de l'utilisateur actuellement connecté.
// Historique cohérent avec les factures ci-dessous : Premium de mars à juin,
// puis repassage au plan Gratuit le 1er juillet (d'où l'absence de facture
// Premium ce mois-ci, et le compteur de messages qui repart de 0).
export const mockSubscription = {
  planId: "free",
  planTitle: "🎁 Gratuit",
  price: "0 €",
  status: "active", // active | canceled | pending
  // true = l'utilisateur a résilié, mais garde l'accès payant jusqu'à la
  // fin de la période déjà réglée (comme Stripe/Netflix/etc.) ; le retour
  // au plan Gratuit se fait automatiquement au renouvellement, pas tout de
  // suite (voir resolveBillingCycle dans api/billing.js).
  cancelAtPeriodEnd: false,
  startedAt: "2026-07-01",
  renewalDate: "2026-08-01",
  billingCycle: "Mensuel",
  defaultPaymentMethodId: "pm-1",
  usedPlanIds: ["free", "premium"], // Plans déjà utilisés — ne peuvent pas être choisis à nouveau
};

// Moyens de paiement enregistrés par l'utilisateur.
export const mockPaymentMethods = [
  {
    id: "pm-1",
    type: "card",
    brand: "Visa",
    last4: "4242",
    expiry: "09/28",
    holder: "Amine Ben Salah",
    isDefault: true,
  },
  {
    id: "pm-2",
    type: "card",
    brand: "Mastercard",
    last4: "8891",
    expiry: "03/27",
    holder: "Amine Ben Salah",
    isDefault: false,
  },
  {
    id: "pm-3",
    type: "paypal",
    email: "amine.bs@example.com",
    isDefault: false,
  },
];

// Historique complet des transactions (pas seulement les 2 dernières factures).
export const mockInvoices = [
  {
    id: "INV-005",
    date: "2026-07-01",
    amount: "0 €",
    status: "paid",
    planId: "free",
    planTitle: "Gratuit",
    method: "—",
    description: "Passage au plan Gratuit (fin de l'abonnement Premium)",
  },
  {
    id: "INV-004",
    date: "2026-06-01",
    amount: "29 €",
    status: "paid",
    planId: "premium",
    planTitle: "Premium",
    method: "Visa •••• 4242",
    description: "Abonnement Premium — Juin 2026",
  },
  {
    id: "INV-003",
    date: "2026-05-01",
    amount: "29 €",
    status: "failed",
    planId: "premium",
    planTitle: "Premium",
    method: "Mastercard •••• 8891",
    description: "Abonnement Premium — Mai 2026 (échec, nouvelle tentative réussie)",
  },
  {
    id: "INV-002",
    date: "2026-04-01",
    amount: "0,50 €",
    status: "paid",
    planId: "pay-per-use",
    planTitle: "Paiement à l'usage",
    method: "PayPal",
    description: "Conversation débloquée — annonce #12",
  },
  {
    id: "INV-001",
    date: "2026-03-01",
    amount: "29 €",
    status: "pending",
    planId: "premium",
    planTitle: "Premium",
    method: "Virement bancaire",
    description: "Abonnement Premium — Mars 2026",
  },
];

export const mockPlans = [
  {
    id: "free",
    title: "🎁 Gratuit",
    price: "0 €",
    subtitle: "50 premiers messages offerts",
    features: [
      "50 messages gratuits",
      "Création d'annonces",
      "Matching IA",
      "Consultation du catalogue",
    ],
    buttonLabel: "Plan actuel",
    highlighted: false,
  },
  {
    id: "pay-per-use",
    title: "💬 Paiement à l'usage",
    price: "0,50 €",
    priceValue: 0.5,
    subtitle: "Par conversation",
    features: [
      "Aucun abonnement",
      "Paiement uniquement à l'utilisation",
      "Flexible",
    ],
    buttonLabel: "Choisir cette formule",
    highlighted: false,
  },
  {
    id: "premium",
    title: "🚀 Premium",
    price: "29 €/mois",
    priceValue: 29,
    subtitle: "Pour les utilisateurs intensifs",
    features: [
      "Messages illimités",
      "Matching prioritaire",
      "Support prioritaire",
      "Historique avancé",
    ],
    buttonLabel: "Passer Premium",
    highlighted: true,
  },
];

export function getPlanById(planId) {
  return mockPlans.find((plan) => plan.id === planId) || null;
}
