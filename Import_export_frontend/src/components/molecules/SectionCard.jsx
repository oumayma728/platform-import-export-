import { colors, radius, spacing, shadow, typography } from "../../styles/tokens";

export default function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: colors.surfaceRaised,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        boxShadow: shadow.card,
      }}
    >
      {title && (
        <h2
          style={{
            fontFamily: typography.display,
            fontSize: typography.fontSizeLg,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
