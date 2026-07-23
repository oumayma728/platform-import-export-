import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getKYBVerifications, reviewKYB } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const STATUT_MAP = {
  pending: { label: "En attente", color: "#D97706" },
  verified: { label: "Vérifié", color: colors.success },
  rejected: { label: "Rejeté", color: colors.danger },
};

export default function AdminKYBPage() {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [reviewModal, setReviewModal] = useState(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");

  const fetchData = (st = filter) => {
    setIsLoading(true);
    const params = {};
    if (st) params.statut = st;
    getKYBVerifications(params)
      .then(setVerifications)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(""); }, []);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  async function handleReview(statut) {
    if (!reviewModal) return;
    try {
      await reviewKYB(reviewModal.id, { statut, score: score ? parseInt(score) : null, commentaire: comment || null });
      setReviewModal(null);
      setScore("");
      setComment("");
      fetchData();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Vérification KYB
      </h1>

      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg }}>
        {["", "pending", "verified", "rejected"].map((v) => (
          <button key={v} onClick={() => { setFilter(v); fetchData(v); }}
            style={{ padding: "6px 14px", border: `1px solid ${filter === v ? colors.primary : colors.border}`, borderRadius: radius.sm, background: filter === v ? colors.primarySoft : "#fff", color: filter === v ? colors.primary : colors.textMuted, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
            {v === "" ? "Tous" : STATUT_MAP[v]?.label || v}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.dangerBg, color: colors.danger, marginBottom: spacing.md }}>{error}</div>}

      {isLoading ? <p style={{ color: colors.textMuted }}>Chargement...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {verifications.length === 0 ? (
            <p style={{ color: colors.textMuted }}>Aucune vérification KYB.</p>
          ) : verifications.map((v) => {
            const st = STATUT_MAP[v.statut] || { label: v.statut, color: "#666" };
            return (
              <div key={v.id} style={{ background: colors.surfaceRaised, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm }}>
                <div>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>{v.entrepriseNom}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: st.color, padding: "2px 8px", borderRadius: radius.full, backgroundColor: `${st.color}15` }}>{st.label}</span>
                    {v.score != null && <span style={{ fontSize: 12, color: colors.textMuted }}>Score: {v.score}/100</span>}
                  </div>
                  {v.commentaire && <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeSm, color: colors.textMuted }}>{v.commentaire}</p>}
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Créé le {v.createdAt?.split("T")[0]}</p>
                </div>
                {v.statut === "pending" && (
                  <button onClick={() => setReviewModal(v)} style={{ padding: "6px 14px", border: `1px solid ${colors.primary}`, borderRadius: radius.sm, background: "#fff", color: colors.primary, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                    Évaluer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", width: "440px", maxWidth: "90%", borderRadius: radius.lg, padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: spacing.md }}>Évaluer KYB — {reviewModal.entrepriseNom}</h3>
            <label style={{ fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600 }}>Score (0-100) :</label>
            <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, marginTop: 4, marginBottom: spacing.md, boxSizing: "border-box" }} />
            <label style={{ fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600 }}>Commentaire :</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              style={{ width: "100%", padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, marginTop: 4, marginBottom: spacing.md, resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm }}>
              <button onClick={() => setReviewModal(null)} style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={() => handleReview("rejected")} style={{ padding: "8px 16px", border: "none", borderRadius: radius.sm, backgroundColor: colors.danger, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Rejeter</button>
              <button onClick={() => handleReview("verified")} style={{ padding: "8px 16px", border: "none", borderRadius: radius.sm, backgroundColor: colors.success, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Vérifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
