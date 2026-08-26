import { useState, useEffect } from "react";
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
import { changePlan, getPaymentMethods } from "../api/billing";
import { stripePromise } from "../stripe/stripeClient";
import StripeCardForm from "../components/StripeCardForm";

const PAYMENT_TYPES = [
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
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [showNewCard, setShowNewCard] = useState(false);

  const [orderReference] = useState(
    () => `IND2-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  );

  useEffect(() => {
    getPaymentMethods().then(setSavedMethods).catch(() => {});
  }, []);

  const savedCards = savedMethods.filter((m) => m.type === "card");
  const savedPaypals = savedMethods.filter((m) => m.type === "paypal");
  const defaultMethod = savedMethods.find((m) => m.isDefault);

  async function handlePayWithSaved() {
    setIsPaying(true);
    try {
      await changePlan(planId);
      setIsPaid(true);
    } catch (err) {
      alert(err.message || "Le paiement a échoué.");
    } finally {
      setIsPaying(false);
    }
  }

  function handleNonCardSubmit(e) {
    e.preventDefault();
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
            Référence obligatoire à indiquer dans le virement
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

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {PAYMENT_TYPES.map(({ id, label, Icon }) => {
          const selected = method === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => { setMethod(id); setSelectedSavedId(null); setShowNewCard(false); }}
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

      {method === "card" && (
        <>
          {savedCards.length > 0 && !showNewCard && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Carte enregistrée
              </p>
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedSavedId(card.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: selectedSavedId === card.id ? "2px solid #B8720A" : "1px solid #E4E2DC",
                    backgroundColor: selectedSavedId === card.id ? "#FBF0DC" : "#fff",
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  <CreditCard size={20} color="#B8720A" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#14161C" }}>
                      {card.brand} •••• {card.last4}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                      Expire {card.expiry} · {card.holder}
                    </p>
                  </div>
                  {card.isDefault && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#B8720A", backgroundColor: "#FBF0DC", padding: "2px 8px", borderRadius: 6 }}>
                      Par défaut
                    </span>
                  )}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: selectedSavedId === card.id ? "2px solid #B8720A" : "2px solid #d1d5db",
                      backgroundColor: selectedSavedId === card.id ? "#B8720A" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedSavedId === card.id && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fff" }} />}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowNewCard(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 0",
                  marginTop: 4,
                  background: "none",
                  border: "1px dashed #d1d5db",
                  borderRadius: 12,
                  color: "#6b7280",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Utiliser une autre carte
              </button>
              {selectedSavedId && (
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handlePayWithSaved}
                  style={{
                    width: "100%",
                    padding: 16,
                    marginTop: 16,
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
                    cursor: isPaying ? "default" : "pointer",
                    opacity: isPaying ? 0.7 : 1,
                  }}
                >
                  <Lock size={16} />
                  {isPaying ? "Traitement en cours..." : `Payer ${plan.price}`}
                </button>
              )}
            </div>
          )}

          {(showNewCard || savedCards.length === 0) && (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                planId={planId}
                price={plan.price}
                onSuccess={() => setIsPaid(true)}
              />
            </Elements>
          )}
        </>
      )}

      {method === "paypal" && (
        <>
          {savedPaypals.length > 0 && !showNewCard && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Compte PayPal enregistré
              </p>
              {savedPaypals.map((pp) => (
                <div
                  key={pp.id}
                  onClick={() => setSelectedSavedId(pp.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: selectedSavedId === pp.id ? "2px solid #B8720A" : "1px solid #E4E2DC",
                    backgroundColor: selectedSavedId === pp.id ? "#FBF0DC" : "#fff",
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  <Wallet size={20} color="#B8720A" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#14161C" }}>PayPal</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{pp.email}</p>
                  </div>
                  {pp.isDefault && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#B8720A", backgroundColor: "#FBF0DC", padding: "2px 8px", borderRadius: 6 }}>
                      Par défaut
                    </span>
                  )}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: selectedSavedId === pp.id ? "2px solid #B8720A" : "2px solid #d1d5db",
                      backgroundColor: selectedSavedId === pp.id ? "#B8720A" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedSavedId === pp.id && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fff" }} />}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowNewCard(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 0",
                  marginTop: 4,
                  background: "none",
                  border: "1px dashed #d1d5db",
                  borderRadius: 12,
                  color: "#6b7280",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Utiliser un autre compte PayPal
              </button>
              {selectedSavedId && (
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handlePayWithSaved}
                  style={{
                    width: "100%",
                    padding: 16,
                    marginTop: 16,
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
                    cursor: isPaying ? "default" : "pointer",
                    opacity: isPaying ? 0.7 : 1,
                  }}
                >
                  <Lock size={16} />
                  {isPaying ? "Traitement en cours..." : `Payer ${plan.price}`}
                </button>
              )}
            </div>
          )}

          {(!savedPaypals.length || showNewCard) && (
            <form onSubmit={handleNonCardSubmit}>
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
                {isPaying ? "Traitement en cours..." : `Payer ${plan.price}`}
              </button>
            </form>
          )}
        </>
      )}

      {method === "bank" && (
        <form onSubmit={handleNonCardSubmit}>
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
              : "Confirmer la demande de virement"}
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
