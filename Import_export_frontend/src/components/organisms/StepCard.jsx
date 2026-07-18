import { colors, radius, shadow, typography } from "../../styles/tokens";

export default function StepCard({
  step,
  icon,
  title,
  description,
}) {
  return (
    <div
      className="hover-lift"
      style={{
        background: colors.surfaceRaised,
        borderRadius: radius.lg,
        padding: "28px",
        border: `1px solid ${colors.border}`,
        boxShadow: shadow.card,
        height: "100%",
        minHeight: "220px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {step && (
        <span
          style={{
            position: "absolute",
            top: 24,
            right: 26,
            fontFamily: typography.mono,
            fontSize: 13,
            fontWeight: 500,
            color: colors.border,
          }}
        >
          {String(step).padStart(2, "0")}
        </span>
      )}

      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          background: colors.primarySoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          marginBottom: "20px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: typography.display,
          fontSize: "20px",
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: "12px",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: colors.textMuted,
          fontFamily: typography.body,
          lineHeight: 1.7,
          fontSize: "15px",
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}
