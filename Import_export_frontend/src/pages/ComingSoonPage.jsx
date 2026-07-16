import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import Button from "../components/atoms/Button";
import { colors, radius, spacing, typography } from "../styles/tokens";

export default function ComingSoonPage({ title, description }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: `${spacing.xxl}px ${spacing.md}px`,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          backgroundColor: colors.primarySoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Construction size={40} color={colors.primary} strokeWidth={1.75} />
      </div>

      <h1
        style={{
          fontSize: typography.fontSizeLg,
          fontWeight: 800,
          color: colors.textPrimary,
          marginBottom: 8,
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: typography.fontSizeBase,
          color: colors.textMuted,
          maxWidth: 420,
          marginBottom: spacing.lg,
        }}
      >
        {description || "Cette page est en cours de développement. Elle sera bientôt disponible."}
      </p>

      <span
        style={{
          display: "inline-block",
          padding: "5px 14px",
          borderRadius: radius.full,
          backgroundColor: colors.neutralBg,
          color: colors.neutral,
          fontSize: typography.fontSizeSm,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: spacing.xl,
        }}
      >
        Module en construction
      </span>

      <Link to="/listings">
        <Button variant="secondary">Voir les annonces en attendant</Button>
      </Link>
    </div>
  );
}
