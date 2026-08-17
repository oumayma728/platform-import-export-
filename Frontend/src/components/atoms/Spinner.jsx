import { colors, typography } from "../../styles/tokens";

export default function Spinner({ label = "Chargement..." }) {
  return (
    <p style={{ color: colors.textMuted, fontFamily: typography.body, fontSize: 14 }}>
      {label}
    </p>
  );
}
