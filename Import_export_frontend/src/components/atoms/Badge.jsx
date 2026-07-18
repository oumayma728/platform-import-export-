import { colors, radius, typography } from "../../styles/tokens";

const palette = {
  success: { text: colors.success, bg: colors.successBg },
  info: { text: colors.info, bg: colors.infoBg },
  neutral: { text: colors.neutral, bg: colors.neutralBg },
  danger: { text: colors.danger, bg: colors.dangerBg },
  primary: { text: colors.primary, bg: colors.primarySoft },
};

export default function Badge({ children, tone = "neutral" }) {
  const { bg, text } = palette[tone] || palette.neutral;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 11px",
        borderRadius: radius.sm,
        fontSize: 11,
        fontFamily: typography.body,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        backgroundColor: bg,
        color: text,
      }}
    >
      {children}
    </span>
  );
}
