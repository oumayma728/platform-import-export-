import { Sparkles, ShieldCheck, MessageSquare, CreditCard, Globe2, Gauge } from "lucide-react";
import { colors, radius, shadow, spacing, typography } from "../../styles/tokens";
import Reveal from "../atoms/Reveal";

const FEATURES = [
    {
    Icon: Globe2,
    title: "Portée internationale",
    description: "Un réseau d'importateurs et d'exportateurs actifs sur plusieurs continents.",
  },
  {
    Icon: ShieldCheck,
    title: "Profils vérifiés",
    description: "Chaque entreprise passe par une vérification de profil.",
  },
  {
    Icon: Gauge,
    title: "Mise en relation rapide",
    description: "Publiez une annonce et recevez vos premières suggestions de partenaires en quelques minutes.",
  },
  {
    Icon: Sparkles,
    title: "Matching intelligent",
    description: "Un système de recommandation identifie les partenaires les plus pertinents selon votre secteur et vos critères.",
  },
  {
    Icon: MessageSquare,
    title: "Messagerie intégrée",
    description: "Échangez directement avec vos partenaires potentiels sans quitter la plateforme.",
  },
  {
    Icon: CreditCard,
    title: "Facturation sécurisée",
    description: "Gérez vos abonnements et paiements en toute sécurité, avec un historique clair.",
  },
];

export default function FeatureGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: spacing.md,
      }}
    >
      {FEATURES.map((feature, i) => (
        <Reveal key={feature.title} delay={i * 70}>
          <div
            className="hover-lift"
            style={{
              background: colors.surfaceRaised,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              boxShadow: shadow.card,
              padding: spacing.lg,
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.md,
                background: colors.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.md,
              }}
            >
              <feature.Icon size={22} color="#E3A548" strokeWidth={1.75} />
            </div>

            <h3
              style={{
                fontFamily: typography.display,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              {feature.title}
            </h3>

            <p
              style={{
                fontFamily: typography.body,
                fontSize: 14.5,
                color: colors.textMuted,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {feature.description}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
