import Badge from "../atoms/Badge";

// Registre central de tous les statuts métier de l'app.
const STATUS_MAP = {
  pending: { label: "En attente", tone: "neutral" },
  validated: { label: "Validé", tone: "success" },
  rejected: { label: "Rejeté", tone: "danger" },

  offer: { label: "Offre", tone: "success" },
  demand: { label: "Demande", tone: "info" },
  suspended: { label: "Suspendue", tone: "neutral" },
  closed: { label: "Clôturée", tone: "danger" },

  suggested: { label: "Suggérée", tone: "neutral" },
  in_contact: { label: "En contact", tone: "info" },
  negotiating: { label: "En négociation", tone: "primary" },
  concluded: { label: "Conclue", tone: "success" },

  active: { label: "Actif", tone: "success" },
  canceled: { label: "Annulé", tone: "danger" },

  // Statuts propres aux transactions de facturation.
  paid: { label: "Payée", tone: "success" },
  failed: { label: "Échouée", tone: "danger" },
  refunded: { label: "Remboursée", tone: "neutral" },
};

export default function StatusBadge({ status }) {
  const entry = STATUS_MAP[status] || { label: status, tone: "neutral" };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
