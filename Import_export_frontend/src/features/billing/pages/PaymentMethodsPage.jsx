import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import AsyncState from "../../../components/organisms/AsyncState";
import SectionCard from "../../../components/molecules/SectionCard";
import FormField from "../../../components/molecules/FormField";
import Select from "../../../components/atoms/Select";
import Button from "../../../components/atoms/Button";
import BillingSubNav from "../components/BillingSubNav";
import PaymentMethodCard from "../components/PaymentMethodCard";
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

  async function onSubmit(data) {
    const payload =
      type === "card"
        ? {
            type: "card",
            brand: "Visa",
            last4: data.cardNumber.slice(-4),
            expiry: data.expiry,
            holder: data.holder,
          }
        : { type: "paypal", email: data.email };

    await addPaymentMethod(payload);
    reset();
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

          <form onSubmit={handleSubmit(onSubmit)}>
            {type === "card" ? (
              <>
                <FormField
                  label="Nom sur la carte"
                  name="holder"
                  register={register}
                  rules={{ required: "Nom requis" }}
                  error={errors.holder}
                />
                <FormField
                  label="Numéro de carte"
                  name="cardNumber"
                  register={register}
                  rules={{
                    required: "Numéro requis",
                    pattern: { value: /^\d{13,19}$/, message: "Numéro invalide" },
                  }}
                  error={errors.cardNumber}
                />
                <FormField
                  label="Expiration (MM/AA)"
                  name="expiry"
                  register={register}
                  rules={{ required: "Requis" }}
                  error={errors.expiry}
                />
              </>
            ) : (
              <FormField
                label="Email PayPal"
                name="email"
                type="email"
                register={register}
                rules={{ required: "Email requis" }}
                error={errors.email}
              />
            )}

            <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
              <Button type="submit">Enregistrer</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
