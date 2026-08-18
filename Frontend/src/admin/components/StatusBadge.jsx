/**
 * Badge de couleur pour les statuts de validation.
 * Utilisé dans les tableaux utilisateurs et entreprises.
 */

const STATUS_CONFIG = {
  VALIDE: {
    label: "Validé",
    bg: "#dcfce7",
    color: "#15803d",
    dot: "#16a34a",
  },
  EN_ATTENTE_VALIDATION: {
    label: "En attente",
    bg: "#fef3c7",
    color: "#92400e",
    dot: "#d97706",
  },
  REJETE: {
    label: "Rejeté",
    bg: "#fee2e2",
    color: "#991b1b",
    dot: "#dc2626",
  },
  SUSPENDU: {
    label: "Suspendu",
    bg: "#f3f4f6",
    color: "#374151",
    dot: "#6b7280",
  },
  // KYB statuses
  EN_ATTENTE: {
    label: "En attente",
    bg: "#fef3c7",
    color: "#92400e",
    dot: "#d97706",
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status ?? "—",
    bg: "#f3f4f6",
    color: "#374151",
    dot: "#9ca3af",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.02em",
        background: config.bg,
        color: config.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
