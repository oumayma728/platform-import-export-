import { colors, radius, typography } from "../../styles/tokens";

export default function Textarea({ placeholder, register, name, error, rows = 5, ...rest }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <textarea
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: radius.sm,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontFamily: typography.body,
          fontSize: typography.fontSizeBase,
          backgroundColor: "#fff",
          color: colors.textPrimary,
          boxSizing: "border-box",
          outline: "none",
          resize: "vertical",
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
