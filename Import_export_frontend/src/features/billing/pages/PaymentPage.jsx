import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Wallet,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { mockPlans } from "../mocks/billing.mock";
import { changePlan } from "../api/billing";
import { stripePromise } from "../stripe/stripeClient";
import StripeCardForm from "../components/StripeCardForm";

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", Icon: CreditCard },
  { id: "paypal", label: "PayPal", Icon: Wallet },
  { id: "bank", label: "Virement bancaire", Icon: Landmark },
];

export default function PaymentPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const plan = mockPlans.find((p) => p.id === planId) || mockPlans[mockPlans.length - 1];

  const [method, setMethod] = useState("card");
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Référence de commande unique — c'est CE code, pas l'email, qui permettra
  // de faire correspondre un virement reçu à cette commande précise.
  const [orderReference] = useState(
    () => `IND2-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  );

  function handleNonCardSubmit(e) {
    e.preventDefault();
    // Pas de vrai traitement de paiement pour PayPal/virement — on simule
    // juste le comportement attendu : PayPal est vérifiable instantanément
    // par le prestataire, un virement bancaire ne l'est jamais (il faut
    // recevoir les fonds et rapprocher la référence, ce qui prend
    // plusieurs jours).
    setIsPaying(true);
    setTimeout(async () => {
      setIsPaying(false);
      if (method === "bank") {
        setIsPending(true);
      } else {
        await changePlan(planId);
        setIsPaid(true);
      }
    }, 1200);
  }

  if (isPending) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Landmark size={32} color="#b45309" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          Virement en attente de confirmation
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          Votre demande d'abonnement <strong>{plan.title.replace(/^\S+\s/, "")}</strong> est
          enregistrée. Elle sera activée automatiquement dès réception de votre virement —
          généralement sous 1 à 3 jours ouvrés.
        </p>

        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#92400e", fontWeight: 700 }}>
            ⚠️ Référence obligatoire à indiquer dans le virement
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "monospace",
              fontSize: 20,
              fontWeight: 800,
              color: "#14161C",
              letterSpacing: "0.05em",
            }}
          >
            {orderReference}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#92400e" }}>
            Sans cette référence exacte, nous ne pourrons pas identifier votre paiement et
            l'associer à votre compte.
          </p>
        </div>

        <Link to="/billing">
          <button
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: 12,
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retour à la facturation
          </button>
        </Link>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Paiement confirmé</h1>
        <p style={{ color: "#6b7280", marginBottom: 28 }}>
          Votre abonnement <strong>{plan.title.replace(/^\S+\s/, "")}</strong> est maintenant actif.
          Un reçu vous a été envoyé par email.
        </p>
        <Link to="/billing">
          <button
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: 12,
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retour à la facturation
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <ShieldCheck size={22} color="#B8720A" />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Paiement sécurisé</h1>
      </div>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Vos informations sont chiffrées et ne sont jamais stockées sur nos serveurs.
      </p>

      {/* Récapitulatif du plan choisi */}
      <div
        style={{
          background: "#F6F5F2",
          border: "1px solid #E4E2DC",
          borderRadius: 16,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: "#14161C" }}>{plan.title}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{plan.subtitle}</p>
        </div>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#B8720A" }}>{plan.price}</p>
      </div>

      {/* Choix du mode de paiement */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {PAYMENT_METHODS.map(({ id, label, Icon }) => {
          const selected = method === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 8px",
                borderRadius: 12,
                border: selected ? "2px solid #B8720A" : "1px solid #E4E2DC",
                backgroundColor: selected ? "#FBF0DC" : "#fff",
                cursor: "pointer",
              }}
            >
              <Icon size={20} color={selected ? "#B8720A" : "#6b7280"} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: selected ? "#B8720A" : "#374151",
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {method === "card" ? (
        <Elements stripe={stripePromise}>
          <StripeCardForm
            planId={planId}
            price={plan.price}
            onSuccess={() => setIsPaid(true)}
          />
        </Elements>
      ) : (
        <form onSubmit={handleNonCardSubmit}>
          {method === "paypal" && (
            <div
              style={{
                backgroundColor: "#F6F5F2",
                border: "1px solid #E4E2DC",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                fontSize: 14,
                color: "#374151",
              }}
            >
              Vous serez redirigé vers PayPal pour finaliser le paiement en toute sécurité.
            </div>
          )}

          {method === "bank" && (
            <div
              style={{
                backgroundColor: "#F6F5F2",
                border: "1px solid #E4E2DC",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                fontSize: 14,
                color: "#374151",
                lineHeight: 1.8,
              }}
            >
              IBAN : TN59 1000 6035 0000 0012 3456 <br />
              BIC : BIATTNTT <br />
              Référence à indiquer (obligatoire) :{" "}
              <strong style={{ fontFamily: "monospace" }}>{orderReference}</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={isPaying}
            style={{
              width: "100%",
              padding: 16,
              border: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: isPaying ? "default" : "pointer",
              opacity: isPaying ? 0.7 : 1,
            }}
          >
            {isPaying
              ? "Traitement en cours..."
              : method === "bank"
              ? "Confirmer la demande de virement"
              : `🔒 Payer ${plan.price}`}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => navigate("/billing")}
        style={{
          display: "block",
          margin: "16px auto 0",
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ← Annuler et revenir
      </button>
    </div>
  );
}
