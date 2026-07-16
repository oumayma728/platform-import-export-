import { colors, radius, typography } from "../../styles/tokens";

/**
 * Sélection multiple de certifications sous forme de chips cliquables.
 * `selected` est un tableau de valeurs cochées ; cliquer sur un chip
 * l'ajoute ou le retire du tableau.
 */
export default function CertificationFilter({ options, selected = [], onChange }) {
  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            style={{
              padding: "7px 12px",
              borderRadius: radius.full,
              border: `1px solid ${isActive ? colors.primary : colors.border}`,
              backgroundColor: isActive ? colors.primarySoft : "#fff",
              color: isActive ? colors.primary : colors.textMuted,
              fontSize: typography.fontSizeSm,
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isActive ? "✓ " : ""}
            {option}
          </button>
        );
      })}
    </div>
  );
}
