import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Plus } from "lucide-react";
import AsyncState from "../../../components/organisms/AsyncState";
import SectionCard from "../../../components/molecules/SectionCard";
import Button from "../../../components/atoms/Button";
import BillingSubNav from "../components/BillingSubNav";
import PaymentMethodCard from "../components/PaymentMethodCard";
import AddCardForm from "../components/AddCardForm";
import { stripePromise } from "../stripe/stripeClient";
import {
  getPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "../api/billing";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setIsLoading(true);
    setError(null);
    getPaymentMethods()
      .then(setMethods)
      .catch((err) => setError(err.message || "Erreur lors du chargement"))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleCardAdded() {
    setShowForm(false);
    await load();
  }

  async function handleSetDefault(id) {
    try {
      await setDefaultPaymentMethod(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    try {
      await removePaymentMethod(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: typography.display,
          fontSize: typography.fontSizeXl,
          fontWeight: 800,
          marginBottom: spacing.xs,
        }}
      >
        Moyens de paiement
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Gérez les cartes enregistrées de façon sécurisée avec Stripe.
      </p>

      <BillingSubNav />

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={methods.length === 0 && !showForm}
        emptyLabel="Aucune carte enregistrée."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={handleSetDefault}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </AsyncState>

      {!showForm && (
        <div style={{ marginTop: spacing.lg }}>
          <Button onClick={() => setShowForm(true)}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={16} /> Ajouter une carte
            </span>
          </Button>
        </div>
      )}

      {showForm && (
        <SectionCard title="Nouvelle carte bancaire">
          {!stripePromise ? (
            <p style={{ color: colors.danger }}>
              Stripe n'est pas configuré. Définissez VITE_STRIPE_PUBLISHABLE_KEY dans le fichier .env.local.
            </p>
          ) : (
            <Elements stripe={stripePromise}>
              <AddCardForm onSuccess={handleCardAdded} onCancel={() => setShowForm(false)} />
            </Elements>
          )}
        </SectionCard>
      )}
    </div>
  );
}
