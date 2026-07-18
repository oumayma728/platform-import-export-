import Input from "../atoms/Input";
import { colors, typography } from "../../styles/tokens";

export default function FormField({ label, name, register, rules, error, type, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", marginBottom: 6, fontFamily: typography.body, fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
          {label}
        </label>
      )}
      <Input
        name={name}
        register={(fieldName) => register(fieldName, rules)}
        error={error}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}
