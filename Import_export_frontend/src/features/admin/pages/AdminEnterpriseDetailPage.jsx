import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import {
  getEnterpriseDetail,
  getEnterpriseDocuments,
  getReputationScore,
  reviewKybDocument,
  getKybDocumentViewUrl,
  updateEnterpriseValidation,
  recomputeAllTrustScores,
} from "../api/admin";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const TYPE_DOC_MAP = {
  REGISTRE_COMMERCE: "Registre de commerce",
  CERTIFICATION: "Certification",
  KBIS: "KBIS",
  PIECE_IDENTITE_REPRESENTANT: "Pièce d'identité",
  AUTRE: "Autre document",
};

const DOC_STATUT_MAP = {
  en_attente: { label: "En attente", tone: "primary" },
  valide: { label: "Validé", tone: "success" },
  rejete: { label: "Rejeté", tone: "danger" },
};

const ACTION_TONES = {
  VALIDATION: colors.success,
  REJET: colors.danger,
  SUSPENSION: colors.primary,
  REACTIVATION: colors.info,
  ANNONCE_SUPPRIMEE: colors.danger,
  DOCUMENT_VALIDE: colors.success,
  DOCUMENT_REJETE: colors.danger,
  KYB_VERIFIED: colors.success,
  KYB_REJECTED: colors.danger,
  AWARD_BADGE: colors.success,
  REVOKE_BADGE: colors.danger,
  SIGNALEMENT_REJETE: colors.neutral,
};

export default function AdminEnterpriseDetailPage() {
  const { admin } = useAdmin();
  const { id } = useParams();
  const navigate = useNavigate();
  const [entreprise, setEntreprise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [rejectDocModal, setRejectDocModal] = useState(null);
  const [viewDocModal, setViewDocModal] = useState(null);
  const [docMotif, setDocMotif] = useState("");
  const [companyAction, setCompanyAction] = useState(null);
  const [companyMotif, setCompanyMotif] = useState("");
  const [successMsg, setSuccessMsg] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [reputationLoading, setReputationLoading] = useState(false);

  const fetchDetail = () => {
    setIsLoading(true);
    getEnterpriseDetail(id)
      .then(setEntreprise)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [id]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  async function loadReputation() {
    setReputationLoading(true);
    try {
      const data = await getReputationScore(id);
      setReputation(data);
    } catch (err) { setReputation(null); }
    finally { setReputationLoading(false); }
  }

  useEffect(() => { loadReputation(); }, [id]);

  if (!admin) return <Navigate to="/admin/login" replace />;

  async function handleViewDoc(docId, doc) {
    try {
      const { url } = await getKybDocumentViewUrl(docId);
      setViewDocModal({ doc, url });
    } catch (err) { setError(err.message); }
  }

  async function handleOpenDocuments() {
    try {
      const data = await getEnterpriseDocuments(id);
      setViewDocModal({ docs: data.documents || data || [] });
    } catch (err) { setError(err.message); }
  }

  async function handleApproveDoc(docId) {
    setPendingId(docId);
    try {
      await reviewKybDocument(docId, { statut: "valide" });
      setSuccessMsg("Document validé");
      fetchDetail();
    } catch (err) { setError(err.message); }
    finally { setPendingId(null); }
  }

  async function handleRejectDoc() {
    if (!rejectDocModal || !docMotif.trim()) return;
    setPendingId(rejectDocModal.id);
    try {
      await reviewKybDocument(rejectDocModal.id, { statut: "rejete", motifRejet: docMotif });
      setSuccessMsg("Document rejeté");
      setRejectDocModal(null);
      setDocMotif("");
      fetchDetail();
    } catch (err) { setError(err.message); }
    finally { setPendingId(null); }
  }

  async function handleCompanyDecision() {
    if (!companyAction) return;
    if (companyAction === "reject" && !companyMotif.trim()) return;
    setPendingId("company");
    try {
      await updateEnterpriseValidation(id, { action: companyAction, motif: companyAction === "reject" ? companyMotif : null });
      setSuccessMsg(companyAction === "validate" ? "Entreprise validée" : "Entreprise rejetée");
      setCompanyAction(null);
      setCompanyMotif("");
      fetchDetail();
    } catch (err) { setError(err.message); }
    finally { setPendingId(null); }
  }

  async function handleRecompute() {
    setPendingId("recompute");
    try {
      await recomputeAllTrustScores();
      setSuccessMsg("Scores de confiance recalculés");
      fetchDetail();
      loadReputation();
    } catch (err) { setError(err.message); }
    finally { setPendingId(null); }
  }

  if (isLoading) return <Spinner />;
  if (error && !entreprise) return <ErrorMessage>{error}</ErrorMessage>;

  const docs = entreprise.documents || [];
  const anyReviewable = (entreprise.utilisateurs || []).some((u) => ["pending", "rejected"].includes(u.validationStatus));
  const breakdown = entreprise.trustScoreDetails?.components;

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <Link to="/admin/enterprises" style={{ fontSize: typography.fontSizeSm, color: colors.primary, textDecoration: "none" }}>← Retour aux entreprises</Link>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          {entreprise.nom}
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          {entreprise.pays}{entreprise.ville ? ` · ${entreprise.ville}` : ""} · {entreprise.secteurActivite || "—"} · {entreprise.role}
          {entreprise.siret ? ` · SIRET : ${entreprise.siret}` : ""}
        </p>
      </div>

      {successMsg && <MessageBanner tone="success">{successMsg}</MessageBanner>}
      {error && <MessageBanner tone="danger">{error}</MessageBanner>}

      <div className="grid-3-col" style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <StatCard label="Score de confiance" value={entreprise.trustScore != null ? `${entreprise.trustScore}/100` : "—"} />
        <StatCard label="Annonces actives" value={entreprise.nombreAnnoncesActives} />
        <StatCard label="Utilisateurs rattachés" value={(entreprise.utilisateurs || []).length} />
      </div>

      {entreprise.trustScoreDetails && (
        <Section title="Détail du score de confiance">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: spacing.md }}>
            {breakdown && Object.entries(breakdown).map(([key, val]) => (
              <div key={key} style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: 12, color: colors.textMuted, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.textPrimary }}>{val}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: colors.textMuted }}>
            Calculé le {new Date(entreprise.trustScoreDetails.computed_at).toLocaleString()}
          </p>
          <div style={{ marginTop: spacing.sm, display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
            {(entreprise.trustScoreDetails.badges || []).map((b) => <Tag key={b} tone="primary">{b}</Tag>)}
          </div>
        </Section>
      )}

      <Section title="Score de réputation">
        {reputationLoading ? <Spinner /> : reputation ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: spacing.md }}>
            <div style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Score KYB</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.textPrimary }}>{reputation.kyb_score}/100</p>
            </div>
            <div style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Note moyenne</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.textPrimary }}>{reputation.average_rating != null ? `${reputation.average_rating}/5` : "—"}</p>
            </div>
            <div style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Avis reçus</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.textPrimary }}>{reputation.review_count}</p>
            </div>
            <div style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Malus</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: reputation.malus_count > 0 ? colors.danger : colors.textPrimary }}>{reputation.malus_count}</p>
            </div>
            <div style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Score final de réputation</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.textPrimary }}>{reputation.final_reputation_score}/100</p>
            </div>
            <div style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
              <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Badges</p>
              <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(reputation.badges || []).length === 0 ? (
                  <span style={{ fontSize: 14, color: colors.textMuted }}>—</span>
                ) : reputation.badges.map((b) => <Tag key={b} tone="primary">{b}</Tag>)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: colors.textMuted }}>Score de réputation indisponible.</p>
        )}
      </Section>

      <Section title="Documents KYB">
        {docs.length === 0 ? (
          <p style={{ color: colors.textMuted }}>Aucun document déposé.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
              {docs.map((d) => {
                const st = DOC_STATUT_MAP[d.statut] || { label: d.statut, tone: "neutral" };
                return (
                  <div key={d.id} style={{ width: 240, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden", boxShadow: shadow.card }}>
                    <button
                      type="button"
                      onClick={() => handleViewDoc(d.id, d)}
                      style={{ display: "block", width: "100%", padding: spacing.md, background: "#f8fafc", border: "none", borderBottom: `1px solid ${colors.border}`, cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ display: "block", fontWeight: 700, color: colors.textPrimary }}>{TYPE_DOC_MAP[d.typeDocument] || d.typeDocument}</span>
                      <span style={{ display: "block", marginTop: 4, fontSize: typography.fontSizeSm, color: colors.textMuted }}>{d.nom_document || d.nomDocument || d.nomFichier}</span>
                      {d.date_upload && (
                        <span style={{ display: "block", marginTop: 4, fontSize: 12, color: colors.textMuted }}>
                          Déposé le {new Date(d.date_upload).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </button>
                    <div style={{ padding: spacing.sm, display: "flex", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{formatSize(d.taille)}</span>
                    </div>
                    {d.motifRejet && <p style={{ margin: 0, padding: `0 ${spacing.sm} ${spacing.sm}`, color: colors.danger, fontSize: typography.fontSizeSm }}>Motif : {d.motifRejet}</p>}
                    <div style={{ padding: `0 ${spacing.sm} ${spacing.sm}`, display: "flex", gap: spacing.sm }}>
                      <Button variant="secondary" onClick={() => handleViewDoc(d.id, d)}>Voir</Button>
                      {d.statut === "en_attente" && (
                        <>
                          <Button disabled={pendingId === d.id} onClick={() => handleApproveDoc(d.id)}>
                            {pendingId === d.id ? "..." : "Valider"}
                          </Button>
                          <Button variant="danger" disabled={pendingId === d.id} onClick={() => { setRejectDocModal(d); setDocMotif(""); }}>
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="secondary" onClick={handleOpenDocuments}>Tout ouvrir en galerie</Button>
          </>
        )}
      </Section>

      <Section title="Décision finale sur l'entreprise">
        <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md, alignItems: "center" }}>
          {anyReviewable ? (
            <>
              <Button disabled={pendingId === "company"} onClick={() => { setCompanyAction("validate"); setCompanyMotif(""); }}>
                Approuver l'entreprise
              </Button>
              <Button variant="danger" disabled={pendingId === "company"} onClick={() => { setCompanyAction("reject"); setCompanyMotif(""); }}>
                Rejeter l'entreprise
              </Button>
            </>
          ) : (
            <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm }}>
              Tous les profils rattachés ont déjà été tranchés ({(entreprise.utilisateurs || []).map((u) => u.validationStatus).join(", ") || "aucun"}).
            </p>
          )}
          <Button variant="secondary" disabled={pendingId === "recompute"} onClick={handleRecompute}>
            {pendingId === "recompute" ? "..." : "Recalculer tous les scores"}
          </Button>
        </div>
      </Section>

      <Section title="Historique de modération">
        {(entreprise.adminActions || []).length === 0 ? (
          <p style={{ color: colors.textMuted }}>Aucune action d'audit.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {(entreprise.adminActions || []).map((a) => {
              const tone = ACTION_TONES[a.action || a.typeAction] || colors.neutral;
              return (
                <div key={a.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", marginBottom: 4 }}>
                    <Tag tone={tone} styleColor={tone}>{a.action || a.typeAction}</Tag>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{a.createdAt?.replace("T", " ").slice(0, 19)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textPrimary }}>{a.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {viewDocModal && (
        <Modal wide title={viewDocModal.doc ? `${TYPE_DOC_MAP[viewDocModal.doc.typeDocument] || viewDocModal.doc.typeDocument} — ${viewDocModal.doc.nom_document || viewDocModal.doc.nomDocument || viewDocModal.doc.nomFichier}` : "Galerie des documents"}>
          {viewDocModal.docs ? (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              {viewDocModal.docs.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.sm }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {TYPE_DOC_MAP[d.typeDocument] || d.typeDocument} · {d.nom_document || d.nomDocument || d.nomFichier}
                    </span>
                    {d.date_upload && <span style={{ fontSize: 12, color: colors.textMuted }}>Déposé le {new Date(d.date_upload).toLocaleDateString("fr-FR")}</span>}
                  </div>
                  <Button variant="secondary" onClick={() => handleViewDoc(d.id, d)}>Voir</Button>
                </div>
              ))}
              {viewDocModal.docs.length === 0 && <p style={{ color: colors.textMuted }}>Aucun document.</p>}
            </div>
          ) : (
            <div>
              <iframe src={viewDocModal.url} title="Aperçu du document" style={{ width: "100%", height: 420, border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
                <Button variant="secondary" onClick={() => window.open(viewDocModal.url, "_blank", "noopener")}>Ouvrir dans un onglet</Button>
                <Button variant="dark" onClick={() => setViewDocModal(null)}>Fermer</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {rejectDocModal && (
        <Modal title={`Rejeter — ${TYPE_DOC_MAP[rejectDocModal.typeDocument] || rejectDocModal.typeDocument}`}>
          <textarea
            value={docMotif}
            onChange={(e) => setDocMotif(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: typography.fontSizeBase, resize: "vertical", boxSizing: "border-box" }}
            placeholder="Motif du rejet (obligatoire)..."
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
            <Button variant="secondary" onClick={() => setRejectDocModal(null)}>Annuler</Button>
            <Button variant="danger" disabled={!docMotif.trim() || pendingId === rejectDocModal.id} onClick={handleRejectDoc}>
              {pendingId === rejectDocModal.id ? "..." : "Confirmer le rejet"}
            </Button>
          </div>
        </Modal>
      )}

      {companyAction === "reject" && (
        <Modal title="Rejeter l'entreprise">
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>
            Un motif est obligatoire : il sera transmis aux propriétaires pour qu'ils puissent corriger leur dossier.
          </p>
          <textarea
            value={companyMotif}
            onChange={(e) => setCompanyMotif(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: typography.fontSizeBase, resize: "vertical", boxSizing: "border-box" }}
            placeholder="Motif du rejet..."
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
            <Button variant="secondary" onClick={() => setCompanyAction(null)}>Annuler</Button>
            <Button variant="danger" disabled={!companyMotif.trim() || pendingId === "company"} onClick={handleCompanyDecision}>
              {pendingId === "company" ? "..." : "Confirmer le rejet"}
            </Button>
          </div>
        </Modal>
      )}

      {companyAction === "validate" && (
        <Modal title="Approuver l'entreprise">
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>
            Valider cette entreprise passe tous les profils rattachés à « Validé », décerne le badge entreprise vérifiée et notifie les propriétaires.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm }}>
            <Button variant="secondary" onClick={() => setCompanyAction(null)}>Annuler</Button>
            <Button disabled={pendingId === "company"} onClick={handleCompanyDecision}>
              {pendingId === "company" ? "..." : "Confirmer la validation"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: spacing.xl }}>
      <h2 style={{ fontSize: typography.fontSizeLg, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.md }}>{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
      <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textMuted }}>{label}</p>
      <p style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 800, color: colors.textPrimary, fontFamily: typography.display }}>{value}</p>
    </div>
  );
}

function Tag({ children, tone, styleColor }) {
  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: radius.full,
      backgroundColor: `${styleColor || (tone === "info" ? colors.info : colors.primary)}15`,
      color: styleColor || (tone === "info" ? colors.info : colors.primary),
      fontWeight: 700,
      textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

function MessageBanner({ children, tone }) {
  const isDanger = tone === "danger";
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 18px",
      borderRadius: 14,
      backgroundColor: isDanger ? colors.dangerBg : "#f0fdf4",
      border: `1px solid ${isDanger ? "#fecaca" : "#bbf7d0"}`,
      color: isDanger ? colors.danger : "#16a34a",
      fontWeight: 600,
      marginBottom: spacing.lg,
    }}>
      {isDanger ? "⚠️" : "✅"} {children}
    </div>
  );
}

function Modal({ title, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#fff", width: wide ? 860 : 440, maxWidth: "94%", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "92vh", overflow: "auto" }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.textPrimary }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function formatSize(value) {
  if (value == null || Number(value) === 0) return "—";
  const bytes = Number(value);
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}
