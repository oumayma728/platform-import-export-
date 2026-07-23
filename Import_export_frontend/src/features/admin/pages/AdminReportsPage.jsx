import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getReports, treatReport } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const STATUS_MAP = {
  pending: { label: "En attente", color: "#D97706" },
  processed: { label: "Traité", color: colors.success },
  rejected: { label: "Rejeté", color: "#6B7280" },
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treatModal, setTreatModal] = useState(null);
  const [treatAction, setTreatAction] = useState("dismiss");

  const fetchData = (p = page) => {
    setIsLoading(true);
    getReports({ page: p, limit: 20 })
      .then((data) => { setReports(data.reports); setTotal(data.total); setTotalPages(data.totalPages); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1); }, []);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  async function handleTreat() {
    if (!treatModal) return;
    try {
      await treatReport(treatModal.id, { action: treatAction });
      setTreatModal(null);
      fetchData();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Signalements
      </h1>

      {error && <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.dangerBg, color: colors.danger, marginBottom: spacing.md }}>{error}</div>}

      {isLoading ? <p style={{ color: colors.textMuted }}>Chargement...</p> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} signalement(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {reports.map((r) => {
              const st = STATUS_MAP[r.statut] || { label: r.statut, color: "#666" };
              return (
                <div key={r.id} style={{ background: colors.surfaceRaised, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.sm }}>
                    <div>
                      <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase }}>{r.type}</span>
                        <span style={{ fontSize: typography.fontSizeSm, fontWeight: 600, color: st.color, padding: "2px 8px", borderRadius: radius.full, backgroundColor: `${st.color}15` }}>{st.label}</span>
                      </div>
                      <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSizeSm }}>Motif : {r.motif}</p>
                      {r.reporter && <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>Signalé par : {r.reporter.prenom} {r.reporter.nom}</p>}
                      {r.annonce && <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>Annonce : {r.annonce.titre}</p>}
                      <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: 12 }}>Créé le {r.createdAt?.split("T")[0]}</p>
                    </div>
                    {r.statut === "pending" && (
                      <button onClick={() => setTreatModal(r)} style={{ padding: "6px 14px", border: `1px solid ${colors.primary}`, borderRadius: radius.sm, background: "#fff", color: colors.primary, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                        Traiter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

      {treatModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", width: "420px", maxWidth: "90%", borderRadius: radius.lg, padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: spacing.md }}>Traiter le signalement</h3>
            <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{treatModal.motif}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.md }}>
              {[
                { value: "dismiss", label: "Rejeter (aucune action)", color: colors.neutral },
                { value: "remove", label: "Suspendre l'annonce", color: "#D97706" },
                { value: "block", label: "Suspendre l'utilisateur", color: colors.danger },
              ].map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: spacing.sm, padding: "8px 12px", border: `1px solid ${treatAction === opt.value ? opt.color : colors.border}`, borderRadius: radius.sm, cursor: "pointer", backgroundColor: treatAction === opt.value ? `${opt.color}08` : "#fff" }}>
                  <input type="radio" name="treatAction" value={opt.value} checked={treatAction === opt.value} onChange={() => setTreatAction(opt.value)} />
                  <span style={{ fontWeight: 600, fontSize: typography.fontSizeSm }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm }}>
              <button onClick={() => setTreatModal(null)} style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleTreat} style={{ padding: "8px 16px", border: "none", borderRadius: radius.sm, backgroundColor: colors.primary, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
