import { useState } from "react";

const VALIDATION_STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "VALIDE", label: "Validé" },
  { value: "EN_ATTENTE_VALIDATION", label: "En attente" },
  { value: "REJETE", label: "Rejeté" },
  { value: "SUSPENDU", label: "Suspendu" },
];

const inputStyle = {
  height: "36px",
  padding: "0 10px",
  borderRadius: "7px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontSize: "13px",
  fontFamily: "'Inter', sans-serif",
  color: "#14161C",
  outline: "none",
  transition: "border-color 0.15s ease",
  minWidth: "0",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#9ca3af",
  fontFamily: "'Inter', sans-serif",
  marginBottom: "4px",
  display: "block",
};

/**
 * Barre de filtres pour le dashboard admin.
 *
 * Props:
 *   filters    {Object}   - Valeurs actuelles des filtres
 *   onChange   {function} - Appelée à chaque changement avec les nouveaux filtres
 *   onReset    {function} - Appelée pour réinitialiser tous les filtres
 *   showSector {boolean}  - Affiche ou non le filtre secteur (pour companies)
 */
export default function AdminFilterBar({ filters = {}, onChange, onReset, showSector = false }) {
  const [localFilters, setLocalFilters] = useState(filters);

  function handleChange(key, value) {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onChange(updated);
  }

  function handleReset() {
    const empty = {
      status: "",
      country: "",
      sector: "",
      date_from: "",
      date_to: "",
    };
    setLocalFilters(empty);
    onReset?.();
  }

  const hasActiveFilter = Object.values(localFilters).some((v) => v !== "" && v != null);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "10px",
        border: "1px solid #ebebea",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "flex-end",
      }}
    >
      {/* Statut */}
      <div style={{ display: "flex", flexDirection: "column", flex: "1 1 150px" }}>
        <label style={labelStyle}>Statut</label>
        <select
          style={inputStyle}
          value={localFilters.status ?? ""}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          {VALIDATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pays */}
      <div style={{ display: "flex", flexDirection: "column", flex: "1 1 140px" }}>
        <label style={labelStyle}>Pays</label>
        <input
          type="text"
          style={inputStyle}
          placeholder="Ex: Maroc"
          value={localFilters.country ?? ""}
          onChange={(e) => handleChange("country", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "#B8720A")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      {/* Secteur (optionnel) */}
      {showSector && (
        <div style={{ display: "flex", flexDirection: "column", flex: "1 1 140px" }}>
          <label style={labelStyle}>Secteur</label>
          <input
            type="text"
            style={inputStyle}
            placeholder="Ex: Agriculture"
            value={localFilters.sector ?? ""}
            onChange={(e) => handleChange("sector", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#B8720A")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>
      )}

      {/* Date de début */}
      <div style={{ display: "flex", flexDirection: "column", flex: "1 1 140px" }}>
        <label style={labelStyle}>Inscrit depuis</label>
        <input
          type="date"
          style={inputStyle}
          value={localFilters.date_from ?? ""}
          onChange={(e) => handleChange("date_from", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "#B8720A")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      {/* Date de fin */}
      <div style={{ display: "flex", flexDirection: "column", flex: "1 1 140px" }}>
        <label style={labelStyle}>Jusqu'au</label>
        <input
          type="date"
          style={inputStyle}
          value={localFilters.date_to ?? ""}
          onChange={(e) => handleChange("date_to", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "#B8720A")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      {/* Bouton reset */}
      {hasActiveFilter && (
        <button
          onClick={handleReset}
          style={{
            height: "36px",
            padding: "0 14px",
            borderRadius: "7px",
            border: "1px solid #e5e7eb",
            background: "transparent",
            fontSize: "12px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: "#6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
            alignSelf: "flex-end",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#dc2626";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          ✕ Réinitialiser
        </button>
      )}
    </div>
  );
}
