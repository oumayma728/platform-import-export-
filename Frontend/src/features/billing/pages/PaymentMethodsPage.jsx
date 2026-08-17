import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Elements } from "@stripe/react-stripe-js";
import { Plus } from "lucide-react";
import AsyncState from "../../../components/organisms/AsyncState";
import SectionCard from "../../../components/molecules/SectionCard";
import FormField from "../../../components/molecules/FormField";
import Select from "../../../components/atoms/Select";
import Button from "../../../components/atoms/Button";
import BillingSubNav from "../components/BillingSubNav";
import PaymentMethodCard from "../components/PaymentMethodCard";
import AddCardForm from "../components/AddCardForm";
import { stripePromise } from "../stripe/stripeClient";
import {
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "../api/billing";
import { colors, spacing, typography } from "../../../styles/tokens";

const TYPE_OPTIONS = [
  { value: "card", label: "Carte bancaire" },
  { value: "paypal", label: "PayPal" },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("card");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  function load() {
    setIsLoading(true);
    getPaymentMethods()
      .then(setMethods)
      .catch((err) => setError(err.message || "Erreur lors du chargement"))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  // Branche PayPal : formulaire react-hook-form classique, un seul champ.
  async function onSubmit(data) {
    await addPaymentMethod({ type: "paypal", email: data.email });
    reset();
    setShowForm(false);
    load();
  }

  // Branche carte : le paiement est déjà tokenisé par Stripe dans
  // AddCardForm (numéro/expiration/CVC réels), on reçoit ici les infos
  // publiques (marque, 4 derniers chiffres, expiration) prêtes à stocker.
  async function handleCardAdded(cardMethod) {
    await addPaymentMethod(cardMethod);
    setShowForm(false);
    load();
  }

  async function handleSetDefault(id) {
    await setDefaultPaymentMethod(id);
    load();
  }

  async function handleRemove(id) {
    await removePaymentMethod(id);
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.xs }}>
        Moyens de paiement
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Gérez les cartes et comptes enregistrés pour vos renouvellements automatiques.
      </p>

      <BillingSubNav />

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={methods.length === 0 && !showForm}
        emptyLabel="Aucun moyen de paiement enregistré."
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
              <Plus size={16} /> Ajouter un moyen de paiement
            </span>
          </Button>
        </div>
      )}

      {showForm && (
        <SectionCard title="Nouveau moyen de paiement">
          <div style={{ marginBottom: spacing.md }}>
            <Select
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
              placeholder="Type de moyen de paiement"
            />
          </div>

          {type === "card" ? (
            <Elements stripe={stripePromise}>
              <AddCardForm onSuccess={handleCardAdded} onCancel={() => setShowForm(false)} />
            </Elements>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormField
                label="Email PayPal"
                name="email"
                type="email"
                register={register}
                rules={{ required: "Email requis" }}
                error={errors.email}
              />

              <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
                <Button type="submit">Enregistrer</Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </SectionCard>
      )}
    </div>
  );
}
