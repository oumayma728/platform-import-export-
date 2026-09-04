import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, CreditCard } from "lucide-react";

import {
  changePlan,
  confirmPayment,
  waitForPlanUpdate,
  createSubscriptionCheckout,
} from "../api/billing";

import { createPaymentIntent } from "../api/payments";
import { USE_MOCKS } from "../../../api/client";

// Style du champ Stripe Elements.
// Utilisé uniquement pour le paiement à l'usage.
// Le Premium utilise Stripe Checkout.
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#14161C",
      fontFamily: "'Inter', sans-serif",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#C22D2D",
    },
  },
};

export default function StripeCardForm({ planId, price, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ============================================================
   * PREMIUM
   * ============================================================
   *
   * Le Premium est un véritable abonnement Stripe.
   *
   * IMPORTANT :
   * On NE crée plus de PaymentIntent pour Premium.
   *
   * Flux :
   *
   * Frontend
   *    ↓
   * POST /billing/subscribe
   *    ↓
   * Stripe Checkout
   *    ↓
   * mode = subscription
   *    ↓
   * Stripe crée la Subscription
   *    ↓
   * webhook
   *    ↓
   * ABONNE + is_premium = true
   */
  async function handlePremiumCheckout() {
    setIsProcessing(true);
    setError(null);

    try {
      // En mode mock, on conserve le comportement de démonstration.
      if (USE_MOCKS) {
        await changePlan("premium");

        sessionStorage.setItem("pending-billing-refresh", "premium");

        window.dispatchEvent(new Event("billing-updated"));

        onSuccess?.();
        return;
      }

      // URL appelée après un paiement Checkout réussi.
      //
      // On revient directement sur la page de facturation.
      // Le statut réel sera ensuite récupéré depuis le backend.
      const successUrl =
        `${window.location.origin}/billing` +
        "?stripe=success&plan=premium";

      const cancelUrl =
        `${window.location.origin}/billing` +
        "?stripe=cancel&plan=premium";

      const checkout = await createSubscriptionCheckout(
        successUrl,
        cancelUrl
      );

      if (!checkout?.checkout_url) {
        throw new Error(
          "Stripe n'a pas retourné l'URL de paiement."
        );
      }

      // Redirection vers Stripe Checkout.
      window.location.assign(checkout.checkout_url);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Impossible de créer l'abonnement Premium."
      );

      setIsProcessing(false);
    }
  }

  /**
   * ============================================================
   * PAIEMENT À L'USAGE
   * ============================================================
   *
   * Ce flux reste un PaymentIntent classique.
   *
   * Flux :
   *
   * Frontend
   *    ↓
   * POST /payments/create-intent
   *    ↓
   * PaymentIntent Stripe
   *    ↓
   * confirmCardPayment()
   *    ↓
   * webhook payment_intent.succeeded
   *    ↓
   * PAIEMENT_USAGE
   */
  async function handleUsagePayment(e) {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe n'est pas encore prêt.");
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Le champ de carte n'est pas disponible.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Création du PaymentMethod côté Stripe.
      const { paymentMethod, error: stripeError } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentMethod?.id) {
        throw new Error(
          "Impossible de créer le moyen de paiement."
        );
      }

      // ========================================================
      // MOCK
      // ========================================================

      if (USE_MOCKS) {
        await changePlan("pay-per-use");

        sessionStorage.setItem(
          "pending-billing-refresh",
          "pay-per-use"
        );

        window.dispatchEvent(new Event("billing-updated"));

        onSuccess?.();
        return;
      }

      // ========================================================
      // BACKEND RÉEL
      // ========================================================

      // Création du PaymentIntent côté backend.
      const intent = await createPaymentIntent("pay-per-use");

      if (!intent?.clientSecret) {
        throw new Error(
          "Le backend n'a pas retourné le clientSecret Stripe."
        );
      }

      // Confirmation du PaymentIntent.
      const {
        paymentIntent,
        error: confirmError,
      } = await stripe.confirmCardPayment(
        intent.clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!paymentIntent) {
        throw new Error(
          "Stripe n'a pas retourné le PaymentIntent."
        );
      }

      // Confirmation côté backend.
      await confirmPayment(paymentIntent.id);

      // Le webhook Stripe est asynchrone.
      // On attend que le backend passe réellement
      // en PAIEMENT_USAGE.
      await waitForPlanUpdate("pay-per-use", {
        attempts: 30,
        delayMs: 1000,
      });

      sessionStorage.setItem(
        "pending-billing-refresh",
        "pay-per-use"
      );

      window.dispatchEvent(new Event("billing-updated"));

      onSuccess?.();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Le paiement n'a pas pu être confirmé."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * ============================================================
   * PREMIUM : AFFICHAGE
   * ============================================================
   *
   * Pas de CardElement ici.
   *
   * Le client est envoyé vers Stripe Checkout.
   */
  if (planId === "premium") {
    return (
      <div>
        {error && (
          <div
            style={{
              color: "#C22D2D",
              fontSize: 13,
              marginBottom: 14,
              padding: "12px 14px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            backgroundColor: "#F6F5F2",
            border: "1px solid #E4E2DC",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 18,
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          <strong
            style={{
              color: "#374151",
              display: "block",
              marginBottom: 4,
            }}
          >
            Abonnement Premium
          </strong>

          Vous allez être redirigé vers Stripe pour effectuer
          votre paiement sécurisé et activer votre abonnement
          mensuel.
        </div>

        <button
          type="button"
          onClick={handlePremiumCheckout}
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: 16,
            border: "none",
            borderRadius: 14,
            background:
              "linear-gradient(135deg,#B8720A,#9C5E08)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: isProcessing ? "default" : "pointer",
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          <Lock size={16} />

          {isProcessing
            ? "Redirection vers Stripe..."
            : `Continuer vers Stripe — ${price}`}
        </button>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          <CreditCard size={14} />
          Paiement sécurisé par Stripe
        </div>
      </div>
    );
  }

  /**
   * ============================================================
   * PAIEMENT À L'USAGE : FORMULAIRE CARTE
   * ============================================================
   */

  return (
    <form onSubmit={handleUsagePayment}>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Nom sur la carte"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #E4E2DC",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          padding: "14px",
          borderRadius: 10,
          border: `1px solid ${
            error ? "#C22D2D" : "#E4E2DC"
          }`,
          marginBottom: 12,
          backgroundColor: "#fff",
        }}
      >
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <p
          style={{
            color: "#C22D2D",
            fontSize: 13,
            margin: "0 0 12px",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          backgroundColor: "#F6F5F2",
          border: "1px solid #E4E2DC",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 20,
          fontSize: 12.5,
          color: "#6b7280",
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: "#374151" }}>
          Mode test — cartes Stripe :
        </strong>

        <br />

        4242 4242 4242 4242 → paiement accepté

        <br />

        4000 0000 0000 0002 → carte refusée

        <br />

        4000 0025 0000 3155 → authentification 3D Secure

        <br />

        Date d'expiration future quelconque, CVC quelconque
        à 3 chiffres.
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{
          width: "100%",
          padding: 16,
          border: "none",
          borderRadius: 14,
          background:
            "linear-gradient(135deg,#B8720A,#9C5E08)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: isProcessing ? "default" : "pointer",
          opacity:
            !stripe || isProcessing ? 0.7 : 1,
        }}
      >
        <Lock size={16} />

        {isProcessing
          ? "Traitement en cours..."
          : `Payer ${price}`}
      </button>
    </form>
  );
}