import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getKYBVerifications, getKYBChecklist, reviewKYB, getKybDocumentViewUrl } from "../api/admin";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const STATUT_MAP = {
  pending: { label: "En attente", tone: "primary" },
  verified: { label: "Vérifié", tone: "success" },
  rejected: { label: "Rejeté", tone: "danger" },
};

const DOC_STATUT = {
  en_attente: { label: "En attente", tone: "neutral" },
  valide: { label: "Validé", tone: "success" },
  rejete: { label: "Rejeté", tone: "danger" },
};

const FILTERS = [
  { value: "", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "verified", label: "Vérifié" },
  { value: "rejected", label: "Rejeté" },
];

export default function AdminKYBPage() {
  const { admin } = useAdmin();
  const [verifications, setVerifications] = useState([]);
  const [checklistDef, setChecklistDef] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [reviewModal, setReviewModal] = useState(null);
  const [checked, setChecked] = useState({});
  const [comment, setComment] = useState("");
  const [docLoadingId, setDocLoadingId] = useState(null);

  const totalCriteria = checklistDef.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const derivedScore = totalCriteria ? Math.round((checkedCount / totalCriteria) * 100) : 0;

  async function openDoc(doc) {
    setDocLoadingId(doc.id);
    try {
      const { url } = await getKybDocumentViewUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message);
    } finally {
      setDocLoadingId(null);
    }
  }

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

  useEffect(() => {
    getKYBChecklist()
      .then(setChecklistDef)
      .catch(() => {});
  }, []);

  function openReviewModal(v) {
    const initial = {};
    (v.checklist || []).forEach((code) => { initial[code] = true; });
    setChecked(initial);
    setComment(v.commentaire || "");
    setReviewModal(v);
  }

  if (!admin) return <Navigate to="/admin/login" replace />;

  async function handleReview(statut) {
    if (!reviewModal) return;
    try {
      const checklist = checklistDef.map((c) => c.code).filter((code) => checked[code]);
      await reviewKYB(reviewModal.id, { statut, checklist, commentaire: comment || null });
      setReviewModal(null);
      setChecked({});
      setComment("");
      fetchData();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Vérification KYB
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Évaluez le score de fiabilité des entreprises (Know Your Business).
        </p>
      </div>

      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap" }}>
        {FILTERS.map((v) => (
          <button
            key={v.value}
            onClick={() => { setFilter(v.value); fetchData(v.value); }}
            style={{
              padding: "7px 14px",
              border: `1px solid ${filter === v.value ? colors.primary : colors.border}`,
              borderRadius: radius.sm,
              background: filter === v.value ? colors.primarySoft : "#fff",
              color: filter === v.value ? colors.primary : colors.textMuted,
              fontWeight: 600,
              fontSize: typography.fontSizeSm,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {verifications.length === 0 ? (
            <p style={{ color: colors.textMuted }}>Aucune vérification KYB.</p>
          ) : verifications.map((v) => {
            const st = STATUT_MAP[v.statut] || { label: v.statut, tone: "neutral" };
            return (
              <div key={v.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm }}>
                <div>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>{v.entrepriseNom}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {v.score != null && <span style={{ fontSize: 12, color: colors.textMuted }}>Score: {v.score}/100</span>}
                  </div>
                  {v.commentaire && <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeSm, color: colors.textMuted }}>{v.commentaire}</p>}
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Créé le {v.createdAt?.split("T")[0]}</p>
                </div>
                {v.statut === "pending" && (
                  <Button variant="secondary" onClick={() => openReviewModal(v)}>Évaluer</Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", width: "440px", maxWidth: "90%", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0, marginBottom: spacing.md, color: colors.textPrimary }}>Évaluer KYB — {reviewModal.entrepriseNom}</h3>

            <label style={{ fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600 }}>Documents déposés :</label>
            {reviewModal.uploadedDocuments?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, marginBottom: spacing.md }}>
                {reviewModal.uploadedDocuments.map((doc) => {
                  const ds = DOC_STATUT[doc.statut] || { label: doc.statut, tone: "neutral" };
                  return (
                    <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: colors.surfaceRaised }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nomFichier}</p>
                        <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>
                          {doc.typeDocument}
                          {doc.motifRejet ? ` — ${doc.motifRejet}` : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexShrink: 0 }}>
                        <Badge tone={ds.tone}>{ds.label}</Badge>
                        <button
                          type="button"
                          onClick={() => openDoc(doc)}
                          disabled={docLoadingId === doc.id}
                          style={{ padding: "5px 10px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", color: colors.textPrimary, fontSize: 12, fontWeight: 600, cursor: docLoadingId === doc.id ? "wait" : "pointer" }}
                        >
                          {docLoadingId === doc.id ? "..." : "Voir"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: colors.textMuted, fontSize: 13, marginTop: 6, marginBottom: spacing.md }}>Aucun document déposé.</p>
            )}

            <label style={{ fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600 }}>Checklist de vérification :</label>
            <p style={{ margin: "2px 0 8px", fontSize: 12, color: colors.textMuted }}>
              Cochez les critères vérifiés. Le score KYB est calculé automatiquement.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: spacing.md }}>
              {checklistDef.map((c) => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: colors.surfaceRaised, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={!!checked[c.code]}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [c.code]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: colors.primary }}
                  />
                  {c.label}
                </label>
              ))}
              {checklistDef.length === 0 && <p style={{ fontSize: 12, color: colors.textMuted }}>Checklist indisponible.</p>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: spacing.md, padding: "10px 12px", borderRadius: radius.sm, background: colors.primarySoft }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>Score KYB calculé :</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: colors.primary }}>{derivedScore}/100</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>({checkedCount}/{totalCriteria} critères validés)</span>
            </div>

            <label style={{ fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600 }}>Commentaire :</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              style={{ width: "100%", padding: "8px 12px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, marginTop: 4, marginBottom: spacing.md, resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm }}>
              <Button variant="secondary" onClick={() => setReviewModal(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => handleReview("rejected")}>Rejeter</Button>
              <Button onClick={() => handleReview("verified")}>Vérifier</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
