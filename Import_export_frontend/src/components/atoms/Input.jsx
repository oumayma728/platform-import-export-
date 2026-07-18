import { colors, radius, typography } from "../../styles/tokens";

export default function Input({ type = "text", placeholder, register, name, error, ...rest }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <input
        type={type}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: radius.sm,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontFamily: typography.body,
          fontSize: typography.fontSizeBase,
          backgroundColor: "#fff",
          color: colors.textPrimary,
          boxSizing: "border-box",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = colors.primary)}
        onBlur={(e) => (e.target.style.borderColor = error ? colors.danger : colors.border)}
        {...(register ? register(name) : {})}
        {...rest}
      />
      {error && (
        <p style={{ color: colors.danger, fontSize: typography.fontSizeSm, margin: "4px 0 0" }}>
          {error.message}
        </p>
      )}
    </div>
  );
}
