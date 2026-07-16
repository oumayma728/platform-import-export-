import { Link } from "react-router-dom";
import { Lightbulb } from "lucide-react";

/**
 * S'affiche uniquement quand c'est pertinent (voir getSmartRecommendation) :
 * l'utilisateur paierait plus cher à l'usage qu'avec l'abonnement Premium.
 */
export default function SmartRecommendationBanner({ recommendation }) {
  if (!recommendation) return null;

  const { messageCount, estimatedPayPerUseCost, premiumPrice, savings } = recommendation;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        background: "linear-gradient(135deg,#FBF0DC,#f5f3ff)",
        border: "1px solid #c7d2fe",
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Lightbulb size={20} color="#B8720A" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 14, color: "#3730a3", lineHeight: 1.5 }}>
          Avec <strong>{messageCount} messages</strong> ce mois-ci, le paiement à l'usage vous
          coûterait <strong>{estimatedPayPerUseCost.toFixed(2)} €</strong> — l'abonnement Premium
          ({premiumPrice} €) vous ferait économiser <strong>{savings.toFixed(2)} €</strong>.
        </p>
      </div>
      <Link to="/billing/checkout/premium">
        <button
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: 10,
            background: "linear-gradient(135deg,#B8720A,#9C5E08)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Passer Premium
        </button>
      </Link>
    </div>
  );
}
