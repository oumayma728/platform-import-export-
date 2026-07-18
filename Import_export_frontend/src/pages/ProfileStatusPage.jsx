import { useNavigate } from "react-router-dom";
import { RefreshCw, Edit3, ArrowRight } from "lucide-react";
import StatusBadge from "../components/molecules/StatusBadge";
import Reveal from "../components/atoms/Reveal";
import { useAuth } from "../context/AuthContext";
import { colors, radius, shadow, spacing, typography } from "../styles/tokens";

const STATUS_CONTENT = {
  pending: {
    icon: "⏳",
    title: "Vérification en cours",
    message:
      "Votre profil est en cours de vérification par notre équipe. Cela prend généralement 24 à 48h. Vous pouvez déjà explorer le catalogue et préparer vos annonces en attendant.",
  },
  validated: {
    icon: "✅",
    title: "Profil validé",
    message:
      "Votre profil a été vérifié avec succès. Vous pouvez publier des annonces et contacter d'autres membres en toute confiance.",
  },
  rejected: {
    icon: "❌",
    title: "Profil rejeté",
    message:
      "Votre profil n'a pas été validé. Vérifiez que les informations fournies (nom d'entreprise, pays, certifications) sont exactes et complètes, puis soumettez-le à nouveau.",
  },
};

export default function ProfileStatusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const status = user?.profileStatus || "pending";
  const content = STATUS_CONTENT[status] || STATUS_CONTENT.pending;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Reveal>
        <span className="eyebrow">Vérification</span>
        <h1
          style={{
            fontFamily: typography.display,
            fontSize: typography.fontSizeXl,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            marginBottom: spacing.lg,
            color: colors.textPrimary,
          }}
        >
          Statut de votre profil
        </h1>
      </Reveal>

      <Reveal delay={100}>
        <div
          style={{
            background: colors.surfaceRaised,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            boxShadow: shadow.card,
            padding: spacing.xl,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: spacing.md }}>{content.icon}</div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: spacing.md }}>
            <StatusBadge status={status} />
          </div>

          <h2
            style={{
              fontFamily: typography.display,
              fontSize: typography.fontSizeLg,
              fontWeight: 700,
              marginBottom: spacing.sm,
              color: colors.textPrimary,
            }}
          >
            {content.title}
          </h2>

          <p
            style={{
              color: colors.textMuted,
              lineHeight: 1.7,
              marginBottom: spacing.lg,
            }}
          >
            {content.message}
          </p>

          {status === "rejected" && (
            <button
              className="hover-lift"
              onClick={() => navigate("/profile/complete")}
              style={actionButtonStyle(colors.danger)}
            >
              <Edit3 size={16} />
              Modifier et resoumettre mon profil
            </button>
          )}

          {status === "pending" && (
            <button
              className="hover-lift"
              onClick={() => window.location.reload()}
              style={actionButtonStyle(colors.neutral)}
            >
              <RefreshCw size={16} />
              Rafraîchir le statut
            </button>
          )}

          {status === "validated" && (
            <button
              className="hover-lift"
              onClick={() => navigate("/listings/catalog")}
              style={actionButtonStyle(colors.primary)}
            >
              Aller au catalogue
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function actionButtonStyle(color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    border: "none",
    borderRadius: radius.md,
    backgroundColor: color,
    color: "#fff",
    fontFamily: typography.display,
    fontWeight: 700,
    fontSize: typography.fontSizeBase,
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };
}
