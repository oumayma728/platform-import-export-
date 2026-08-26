import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getModerationHistory } from "../api/admin";
import Input from "../../../components/atoms/Input";
import Select from "../../../components/atoms/Select";
import Button from "../../../components/atoms/Button";
import Pagination from "../../../components/molecules/Pagination";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const ACTION_TONES = {
  VALIDATION_ENTREPRISE: { label: "Validation entreprise", tone: colors.success },
  REJET_ENTREPRISE: { label: "Rejet entreprise", tone: colors.danger },
  SUSPENSION: { label: "Suspension", tone: colors.primary },
  REACTIVATION: { label: "Réactivation", tone: colors.info },
  TRAITEMENT_SIGNALEMENT: { label: "Traitement signalement", tone: colors.primary },
  REVIEW_KYB: { label: "Revue KYB", tone: colors.info },
  AWARD_BADGE: { label: "Badge attribué", tone: colors.success },
  REVOKE_BADGE: { label: "Badge révoqué", tone: colors.danger },
};

const ACTION_FILTERS = [
  { value: "VALIDATION", label: "Validation" },
  { value: "REJET", label: "Rejet" },
  { value: "SUSPENSION", label: "Suspension" },
  { value: "REACTIVATION", label: "Réactivation" },
  { value: "KYB", label: "KYB" },
  { value: "AWARD_BADGE", label: "Badge attribué" },
  { value: "REVOKE_BADGE", label: "Badge révoqué" },
  { value: "SIGNALEMENT", label: "Signalement" },
  { value: "ANNONCE", label: "Annonce" },
  { value: "DOCUMENT", label: "Document" },
];

const ENTITY_TYPE_FILTERS = [
  { value: "UTILISATEUR", label: "Utilisateur" },
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "ANNONCE", label: "Annonce" },
  { value: "CONVERSATION", label: "Conversation" },
];

export default function AdminHistoryPage() {
  const { admin } = useAdmin();
  const [actions, setActions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cibleFilter, setCibleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const fetchData = (p = page, cible = cibleFilter, action = actionFilter, entityType = entityTypeFilter) => {
    setIsLoading(true);
    const params = { page: p, limit: 50 };
    if (cible) params.cible_id = cible;
    if (action) params.action = action;
    if (entityType) params.entity_type = entityType;
    getModerationHistory(params)
      .then((data) => { setActions(data.actions); setTotal(data.total); setTotalPages(data.totalPages); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1, "", "", ""); }, []);

  if (!admin) return <Navigate to="/admin/login" replace />;

  function handleFilter(e) { e.preventDefault(); setPage(1); fetchData(1, cibleFilter, actionFilter, entityTypeFilter); }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Historique de modération
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Traçabilité de toutes les actions effectuées par les administrateurs.
        </p>
      </div>

      <form onSubmit={handleFilter} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ minWidth: 280, flex: 1 }}>
          <Input
            type="text"
            placeholder="Filtrer par ID de cible (utilisateur, entreprise, annonce, conversation)..."
            value={cibleFilter}
            onChange={(e) => setCibleFilter(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select
            value={actionFilter}
            placeholder="Toutes les actions"
            options={ACTION_FILTERS}
            onChange={(value) => { setActionFilter(value); setPage(1); fetchData(1, cibleFilter, value, entityTypeFilter); }}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <Select
            value={entityTypeFilter}
            placeholder="Tous les types"
            options={ENTITY_TYPE_FILTERS}
            onChange={(value) => { setEntityTypeFilter(value); setPage(1); fetchData(1, cibleFilter, actionFilter, value); }}
          />
        </div>
        <Button type="submit">Filtrer</Button>
      </form>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} action(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {actions.map((a) => {
              const entry = ACTION_TONES[a.typeAction] || { label: a.typeAction, tone: colors.neutral };
              return (
                <div key={a.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", marginBottom: 4 }}>
                    <Tag tone={entry.tone}>{entry.label}</Tag>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{a.createdAt?.replace("T", " ").slice(0, 19)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textPrimary }}>{a.description}</p>
                  {a.admin && (
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
                      Par {a.admin.prenom} {a.admin.nom} ({a.admin.email})
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchData(p); }} />
        </>
      )}
    </div>
  );
}

function Tag({ children, tone }) {
  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: radius.full,
      backgroundColor: `${tone}15`,
      color: tone,
      fontWeight: 700,
    }}>
      {children}
    </span>
  );
}
