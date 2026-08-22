import { colors, typography } from "../../styles/tokens";

export default function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <p style={{ color: colors.danger, fontFamily: typography.body, fontSize: typography.fontSizeBase, margin: "8px 0" }}>
      {children}
    </p>
  );
}
