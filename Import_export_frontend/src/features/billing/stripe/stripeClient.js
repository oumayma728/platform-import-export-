import { loadStripe } from "@stripe/stripe-js";

// `loadStripe` doit être appelé une seule fois en dehors du cycle de rendu
// des composants (recommandation officielle Stripe), d'où le module dédié.
// Ne contient QUE la clé publique (pk_...) — la clé secrète (sk_...) ne
// doit jamais apparaître côté frontend, elle reste sur le backend qui crée
// les PaymentIntents.
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey && import.meta.env.DEV) {
  // Avertissement dev uniquement : le formulaire Stripe Elements ne pourra
  // pas s'afficher tant que VITE_STRIPE_PUBLISHABLE_KEY n'est pas définie.
  console.warn(
    "[Stripe] VITE_STRIPE_PUBLISHABLE_KEY n'est pas définie — voir .env.example."
  );
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
