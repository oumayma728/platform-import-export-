import { colors, radius, spacing, shadow, typography } from "../../styles/tokens";

const variants = {
  primary: { backgroundColor: colors.primary, color: "#fff", border: "1px solid transparent" },
  secondary: { backgroundColor: "#fff", color: colors.textPrimary, border: `1px solid ${colors.border}` },
  dark: { backgroundColor: colors.ink, color: "#fff", border: "1px solid transparent" },
  danger: { backgroundColor: colors.danger, color: "#fff", border: "1px solid transparent" },
};

export default function Button({ children, variant = "primary", onClick, type = "button", disabled, fullWidth }) {
  const style = variants[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...style,
        padding: `${spacing.sm + 4}px ${spacing.lg}px`,
        borderRadius: radius.sm,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontFamily: typography.display,
        fontSize: typography.fontSizeBase,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        boxShadow: disabled ? "none" : shadow.card,
        transition: "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease",
        width: fullWidth ? "100%" : "auto",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.backgroundColor = colors.primaryHover;
        if (variant === "secondary") e.currentTarget.style.backgroundColor = colors.surface;
        if (variant === "dark") e.currentTarget.style.backgroundColor = colors.inkSoft;
        e.currentTarget.style.boxShadow = shadow.raised;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.backgroundColor;
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = disabled ? "none" : shadow.card;
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => !disabled && (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}
