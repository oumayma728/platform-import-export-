import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getReports, treatReport, getConversationInvestigation } from "../api/admin";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";
import Pagination from "../../../components/molecules/Pagination";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const STATUS_MAP = {
  pending: { label: "En attente", tone: "primary" },
  processed: { label: "Traité", tone: "success" },
  rejected: { label: "Rejeté", tone: "neutral" },
};

export default function AdminReportsPage() {
  const { admin } = useAdmin();
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treatModal, setTreatModal] = useState(null);
  const [treatAction, setTreatAction] = useState("dismiss");
  const [conversation, setConversation] = useState(null);
  const [convLoading, setConvLoading] = useState(false);

  const fetchData = (p = page) => {
    setIsLoading(true);
    getReports({ page: p, limit: 20 })
      .then((data) => { setReports(data.reports); setTotal(data.total); setTotalPages(data.totalPages); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1); }, []);

  if (!admin) return <Navigate to="/admin/login" replace />;

  async function handleTreat() {
    if (!treatModal) return;
    try {
      await treatReport(treatModal.id, { action: treatAction });
      setTreatModal(null);
      fetchData();
    } catch (err) { setError(err.message); }
  }

  async function handleInvestigate(conversationId) {
    setConvLoading(true);
    setError(null);
    try {
      const data = await getConversationInvestigation(conversationId);
      setConversation(data);
    } catch (err) { setError(err.message); }
    finally { setConvLoading(false); }
  }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Signalements
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Examinez les contenus et comptes signalés par la communauté.
        </p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} signalement(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {reports.map((r) => {
              const st = STATUS_MAP[r.statut] || { label: r.statut, tone: "neutral" };
              return (
                <div key={r.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.sm }}>
                    <div>
                      <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase }}>{r.type}</span>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSizeSm }}>Motif : {r.motif}</p>
                      {r.reporter && <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>Signalé par : {r.reporter.prenom} {r.reporter.nom}</p>}
                      {r.annonce && <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>Annonce : {r.annonce.titre}</p>}
                      {r.conversation && (
                        <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                          Conversation : {r.conversation.id.slice(0, 8)}… ({r.conversation.statut})
                        </p>
                      )}
                      <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: 12 }}>Créé le {r.createdAt?.split("T")[0]}</p>
                    </div>
                    <div style={{ display: "flex", gap: spacing.sm }}>
                      {r.conversation && (
                        <Button variant="secondary" onClick={() => handleInvestigate(r.conversation.id)}>Inspecter</Button>
                      )}
                      {r.statut === "pending" && (
                        <Button variant="secondary" onClick={() => setTreatModal(r)}>Traiter</Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchData(p); }} />
        </>
      )}

      {conversation && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setConversation(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "640px", maxWidth: "92%", maxHeight: "85vh", overflow: "auto", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: spacing.sm, color: colors.textPrimary }}>Investigation de la conversation</h3>
            {convLoading ? <Spinner /> : (
              <>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>
                  Statut : {conversation.statut} · {conversation.nombreMessages} message(s)
                  {conversation.annonce ? ` · Annonce : ${conversation.annonce.titre}` : ""}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
                  {conversation.participants?.map((p) => (
                    <Badge key={p.id} tone={p.validationStatus === "suspended" ? "danger" : p.validationStatus === "validated" ? "success" : "primary"}>
                      {p.role} : {p.prenom} {p.nom} ({p.validationStatus})
                    </Badge>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, maxHeight: "45vh", overflow: "auto", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md }}>
                  {conversation.messages?.length === 0 && <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, margin: 0 }}>Aucun message.</p>}
                  {conversation.messages?.map((m) => (
                    <div key={m.id} style={{ background: colors.surface, borderRadius: radius.sm, padding: spacing.sm }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, marginBottom: 4 }}>
                        <strong style={{ fontSize: typography.fontSizeSm }}>{m.expediteur}</strong>
                        <span style={{ color: colors.textMuted, fontSize: 11 }}>{m.dateEnvoi?.split("T")[0]}</span>
                      </div>
                      <p style={{ margin: 0, color: colors.textPrimary, fontSize: typography.fontSizeSm, whiteSpace: "pre-wrap" }}>{m.contenu}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: spacing.md }}>
                  <Button variant="secondary" onClick={() => setConversation(null)}>Fermer</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {treatModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", width: "420px", maxWidth: "90%", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: spacing.md, color: colors.textPrimary }}>Traiter le signalement</h3>
            <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{treatModal.motif}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.md }}>
              {[
                { value: "dismiss", label: "Rejeter (aucune action)", color: colors.neutral },
                { value: "remove", label: "Suspendre l'annonce", color: colors.primary },
                { value: "block", label: "Suspendre l'utilisateur", color: colors.danger },
              ].map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: spacing.sm, padding: "8px 12px", border: `1px solid ${treatAction === opt.value ? opt.color : colors.border}`, borderRadius: radius.sm, cursor: "pointer", backgroundColor: treatAction === opt.value ? `${opt.color}08` : "#fff" }}>
                  <input type="radio" name="treatAction" value={opt.value} checked={treatAction === opt.value} onChange={() => setTreatAction(opt.value)} />
                  <span style={{ fontWeight: 600, fontSize: typography.fontSizeSm }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm }}>
              <Button variant="secondary" onClick={() => setTreatModal(null)}>Annuler</Button>
              <Button onClick={handleTreat}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
