import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
import { changePlan } from "../api/billing";
import { createPaymentIntent } from "../api/payments";
import { USE_MOCKS } from "../../../api/client";

// Style du champ Stripe Elements — Stripe n'accepte que des propriétés CSS
// simples ici (pas de tokens/objets), donc on recopie les valeurs à la main
// pour rester cohérent avec le reste de l'UI (voir styles/tokens.js).
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#14161C",
      fontFamily: "'Inter', sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#C22D2D" },
  },
};

export default function StripeCardForm({ planId, price, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js n'a pas encore fini de charger

    setIsProcessing(true);
    setError(null);

    // 1. Tokenisation de la carte — VRAI appel réseau à l'API Stripe (avec
    // la clé PUBLIQUE de test), qui valide le numéro/l'expiration/le CVC.
    // C'est cet appel qui permet de "tester les transactions" avec les
    // cartes de test Stripe, même sans backend branché.
    const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
      billing_details: { name: cardholderName },
    });

    if (stripeError) {
      // Erreur renvoyée par Stripe : numéro incomplet, carte refusée
      // (carte de test 4000 0000 0000 0002), etc.
      setError(stripeError.message);
      setIsProcessing(false);
      return;
    }

    try {
      if (USE_MOCKS) {
        // Aucun backend Stripe branché pour créer/confirmer un vrai
        // PaymentIntent : la tokenisation ci-dessus (réelle, faite auprès
        // de Stripe) a déjà prouvé que l'intégration Elements fonctionne
        // avec la carte de test saisie. On simule la confirmation serveur
        // pour activer le plan côté app.
        await changePlan(planId);
      } else {
        // Backend réel : le PaymentIntent est créé côté serveur (clé
        // secrète), puis confirmé ici avec le moyen de paiement tokenisé.
        const intent = await createPaymentIntent(planId);
        const { error: confirmError } = await stripe.confirmCardPayment(intent.clientSecret, {
          payment_method: paymentMethod.id,
        });
        if (confirmError) throw new Error(confirmError.message);
        await changePlan(planId);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Le paiement n'a pas pu être confirmé.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
          border: `1px solid ${error ? "#C22D2D" : "#E4E2DC"}`,
          marginBottom: 12,
          backgroundColor: "#fff",
        }}
      >
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <p style={{ color: "#C22D2D", fontSize: 13, margin: "0 0 12px" }}>{error}</p>
      )}

      {/* Aide-mémoire pour tester : cartes de test officielles Stripe,
          utilisables uniquement en mode test (clé pk_test_...). */}
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
        <strong style={{ color: "#374151" }}>Mode test — cartes Stripe :</strong>
        <br />
        4242 4242 4242 4242 → paiement accepté
        <br />
        4000 0000 0000 0002 → carte refusée
        <br />
        4000 0025 0000 3155 → authentification 3D Secure
        <br />
        Date d'expiration future quelconque, CVC quelconque à 3 chiffres.
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{
          width: "100%",
          padding: 16,
          border: "none",
          borderRadius: 14,
          background: "linear-gradient(135deg,#B8720A,#9C5E08)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: isProcessing ? "default" : "pointer",
          opacity: !stripe || isProcessing ? 0.7 : 1,
        }}
      >
        <Lock size={16} />
        {isProcessing ? "Traitement en cours..." : `Payer ${price}`}
      </button>
    </form>
  );
}
