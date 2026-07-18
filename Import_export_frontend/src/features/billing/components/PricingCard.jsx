import Button from "../../../components/atoms/Button";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

export default function PricingCard({
  title,
  price,
  subtitle,
  features,
  highlighted,
  buttonLabel,
  disabled,
  isCurrent,
  onClick,
}) {
  return (
    <div
      style={{
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.lg,
        padding: spacing.lg,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: highlighted ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
        boxShadow: highlighted ? shadow.highlight : shadow.card,
      }}
    >
      {isCurrent && (
        <div
          style={{
            display: "inline-block",
            alignSelf: "flex-start",
            backgroundColor: colors.successBg,
            color: colors.success,
            padding: "4px 10px",
            borderRadius: radius.full,
            fontSize: typography.fontSizeSm,
            fontWeight: 700,
            marginBottom: spacing.md,
          }}
        >
          PLAN ACTUEL
        </div>
      )}

      <h3 style={{ fontFamily: typography.display, margin: 0 }}>{title}</h3>

      <h1 style={{ textAlign: "center", fontSize: typography.fontSizeXl, margin: `${spacing.md}px 0` }}>
        {price}
      </h1>

      <p style={{ color: colors.textMuted, marginBottom: spacing.md, textAlign: "center" }}>
        {subtitle}
      </p>

      <ul style={{ paddingLeft: 20, marginBottom: spacing.lg, flexGrow: 1 }}>
        {features.map((feature) => (
          <li key={feature} style={{ marginBottom: spacing.xs + 4, color: colors.textPrimary }}>
            {feature}
          </li>
        ))}
      </ul>

      <Button variant={highlighted ? "primary" : "secondary"} disabled={disabled} onClick={onClick} fullWidth>
        {buttonLabel}
      </Button>
    </div>
  );
}
