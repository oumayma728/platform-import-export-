import Select from "../atoms/Select";
import RangeSlider from "../atoms/RangeSlider";
import CertificationFilter from "../molecules/CertificationFilter";
import { spacing } from "../../styles/tokens";

/**
 * FilterBar générique piloté par config, au lieu d'un composant dédié par feature.
 *
 * fields = [
 *   { name: "country", type: "select", placeholder: "Tous les pays", options: [{ value, label }] },
 *   { name: "price", type: "price-range", min: 0, max: 1000 },
 *   { name: "certifications", type: "certifications", options: ["Bio", "ISO 22000"] },
 * ]
 * `type` est optionnel et vaut "select" par défaut, pour rester compatible
 * avec les configurations existantes.
 */
export default function FilterBar({ fields, filters, onChange }) {
  function handleFieldChange(name, value) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <div
      style={{
        display: "flex",
        gap: spacing.lg,
        marginBottom: spacing.lg,
        flexWrap: "wrap", // responsive
        alignItems: "flex-end",
      }}
    >
      {fields.map((field) => {
        const type = field.type || "select";

        if (type === "price-range") {
          const value = filters[field.name] || { min: field.min, max: field.max };
          return (
            <div key={field.name}>
              {field.label && (
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: "0 0 6px" }}>
                  {field.label}
                </p>
              )}
              <RangeSlider
                min={field.min}
                max={field.max}
                unit={field.unit}
                valueMin={value.min}
                valueMax={value.max}
                onChange={(range) => handleFieldChange(field.name, range)}
              />
            </div>
          );
        }

        if (type === "certifications") {
          return (
            <div key={field.name}>
              {field.label && (
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: "0 0 6px" }}>
                  {field.label}
                </p>
              )}
              <CertificationFilter
                options={field.options}
                selected={filters[field.name] || []}
                onChange={(value) => handleFieldChange(field.name, value)}
              />
            </div>
          );
        }

        return (
          <Select
            key={field.name}
            placeholder={field.placeholder}
            options={field.options}
            value={filters[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        );
      })}
    </div>
  );
}
