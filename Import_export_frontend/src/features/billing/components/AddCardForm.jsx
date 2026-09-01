import { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Button from "../../../components/atoms/Button";
import { colors, radius, spacing, typography } from "../../../styles/tokens";
import { createSetupIntent } from "../api/billing";

// Mêmes propriétés visuelles que le champ Input.jsx habituel, recopiées ici
// car Stripe Elements n'accepte que des propriétés CSS simples dans `style`
// (pas nos tokens/objets) — voir la même remarque dans StripeCardForm.jsx.
const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "15px",
      fontFamily: "'Inter', sans-serif",
      color: colors.textPrimary,
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: colors.danger },
  },
};

// Enveloppe un <CardXxxElement> Stripe pour qu'il ressemble exactement à un
// champ Input.jsx classique (même bordure, rayon, hauteur, focus ocre).
function StripeFieldShell({ label, Element, error, onFocusChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: spacing.md }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontFamily: typography.body,
            fontSize: 14,
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: radius.sm,
          border: `1px solid ${error ? colors.danger : focused ? colors.primary : colors.border}`,
          backgroundColor: "#fff",
          transition: "border-color 0.15s ease",
        }}
      >
        <Element
          options={ELEMENT_STYLE}
          onFocus={() => {
            setFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange?.(false);
          }}
        />
      </div>
    </div>
  );
}

export default function AddCardForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();

  const [holder, setHolder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js pas encore chargé
    if (!holder.trim()) {
      setError("Le nom sur la carte est requis.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1) Le backend crée un SetupIntent lié au Customer Stripe.
      const { clientSecret } = await createSetupIntent();
      if (!clientSecret) {
        throw new Error("Stripe n'a pas renvoyé de secret de configuration.");
      }

      // 2) Numéro, expiration et CVC sont envoyés directement à Stripe par
      // Stripe Elements. Notre backend ne reçoit jamais ces données sensibles.
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: { name: holder.trim() },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }
      if (!setupIntent || setupIntent.status !== "succeeded") {
        throw new Error("La carte n'a pas pu être enregistrée.");
      }

      await onSuccess({ id: setupIntent.payment_method });
    } catch (err) {
      setError(err.message || "Le moyen de paiement n'a pas pu être enregistré.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: spacing.md }}>
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontFamily: typography.body,
            fontSize: 14,
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          Nom sur la carte
        </label>
        <input
          type="text"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Prénom Nom"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
            fontFamily: typography.body,
            fontSize: typography.fontSizeBase,
            backgroundColor: "#fff",
            color: colors.textPrimary,
            boxSizing: "border-box",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.primary)}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
      </div>

      <StripeFieldShell label="Numéro de carte" Element={CardNumberElement} />

      <div style={{ display: "flex", gap: spacing.sm }}>
        <div style={{ flex: 1 }}>
          <StripeFieldShell label="Expiration (MM / AA)" Element={CardExpiryElement} />
        </div>
        <div style={{ flex: 1 }}>
          <StripeFieldShell label="CVC" Element={CardCvcElement} />
        </div>
      </div>

      {error && (
        <p style={{ color: colors.danger, fontSize: typography.fontSizeSm, margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
        <Button type="submit" disabled={!stripe || isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
