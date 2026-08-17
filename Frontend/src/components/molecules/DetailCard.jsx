import { colors, radius, spacing, shadow, typography } from "../../styles/tokens";

export default function DetailCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: colors.surfaceRaised,
        borderRadius: radius.md,
        padding: spacing.md,
        textAlign: "center",
        boxShadow: shadow.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontSize: "26px",
          color: colors.primary,
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          color: colors.textMuted,
          fontFamily: typography.body,
          fontSize: "12px",
          fontWeight: "700",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: colors.textPrimary,
          fontFamily: typography.display,
          fontSize: "19px",
          fontWeight: "700",
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}
