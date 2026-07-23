import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getModerationHistory } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const ACTION_COLORS = {
  VALIDATION_ENTREPRISE: colors.success,
  REJET_ENTREPRISE: colors.danger,
  SUSPENSION: "#D97706",
  REACTIVATION: colors.info,
  TRAITEMENT_SIGNALEMENT: colors.primary,
  REVIEW_KYB: colors.info,
  AWARD_BADGE: colors.success,
  REVOKE_BADGE: colors.danger,
};

export default function AdminHistoryPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = (p = page) => {
    setIsLoading(true);
    getModerationHistory({ page: p, limit: 50 })
      .then((data) => { setActions(data.actions); setTotal(data.total); setTotalPages(data.totalPages); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1); }, []);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Historique de modération
      </h1>

      {error && <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.dangerBg, color: colors.danger, marginBottom: spacing.md }}>{error}</div>}

      {isLoading ? <p style={{ color: colors.textMuted }}>Chargement...</p> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} action(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {actions.map((a) => (
              <div key={a.id} style={{ background: colors.surfaceRaised, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: radius.full, backgroundColor: `${ACTION_COLORS[a.typeAction] || "#666"}15`, color: ACTION_COLORS[a.typeAction] || "#666", fontWeight: 700 }}>
                    {a.typeAction}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{a.createdAt?.replace("T", " ").slice(0, 19)}</span>
                </div>
                <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textPrimary }}>{a.description}</p>
                {a.admin && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
                    Par {a.admin.prenom} {a.admin.nom} ({a.admin.email})
                  </p>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center", marginTop: spacing.lg }}>
              <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchData(p); }}
                style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer" }}>Précédent</button>
              <span style={{ padding: "8px 12px", fontSize: typography.fontSizeSm, color: colors.textMuted }}>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); fetchData(p); }}
                style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer" }}>Suivant</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
