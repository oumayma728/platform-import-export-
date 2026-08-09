import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getValidationQueue, validateUser, rejectUser, getKybDocumentViewUrl } from "../api/admin";
import Button from "../../../components/atoms/Button";
import Spinner from "../../../components/atoms/Spinner";
import Pagination from "../../../components/molecules/Pagination";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

export default function AdminValidationPage() {
  const { admin } = useAdmin();
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [motif, setMotif] = useState("");
  const [successMsg, setSuccessMsg] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [docsModal, setDocsModal] = useState(null);
  const [viewDocModal, setViewDocModal] = useState(null);
  const [viewDocLoading, setViewDocLoading] = useState(false);

  const fetchQueue = (p = page) => {
    setIsLoading(true);
    getValidationQueue({ page: p, limit: 10 })
      .then((data) => { setQueue(data.queue); setTotal(data.total); setTotalPages(data.totalPages); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchQueue(1); }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  async function handleViewDoc(docId) {
    setViewDocLoading(true);
    setError(null);
    try {
      const { url } = await getKybDocumentViewUrl(docId);
      const doc = (docsModal || []).find((d) => d.id === docId);
      setViewDocModal({ doc, url });
    } catch (err) {
      setError(err.message);
    } finally {
      setViewDocLoading(false);
    }
  }

  if (!admin) return <Navigate to="/admin/login" replace />;

  async function handleValidate(userId) {
    setPendingId(userId);
    try {
      await validateUser(userId);
      setSuccessMsg("Profil validé avec succès");
      fetchQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }
  async function handleReject() {
    if (!motif.trim()) return;
    setPendingId(rejectModal.id);
    try {
      await rejectUser(rejectModal.id, motif);
      setSuccessMsg("Profil rejeté");
      setRejectModal(null);
      setMotif("");
      fetchQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Validation des profils
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Validez ou rejetez les entreprises en attente d'approbation.
        </p>
      </div>

      {successMsg && <MessageBanner tone="success">{successMsg}</MessageBanner>}
      {error && <MessageBanner tone="danger">{error}</MessageBanner>}

      {isLoading ? <Spinner /> : queue.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun profil en attente de validation.</p>
      ) : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>
            {total} profil(s) en attente de validation
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {queue.map((entry) => (
              <div key={entry.id} style={{
                background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: typography.fontSizeMd, fontWeight: 700 }}>
                      {entry.prenom} {entry.nom}
                    </h3>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>{entry.email}</p>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                      Inscrit le : {entry.dateInscription ? new Date(entry.dateInscription).toLocaleDateString("fr-FR") : "—"}
                    </p>
                    {entry.entreprise && (
                      <div style={{ marginTop: spacing.sm, fontSize: typography.fontSizeSm, color: colors.textMuted }}>
                        <p style={{ margin: 0 }}>Entreprise : <strong>{entry.entreprise.nom}</strong></p>
                        <p style={{ margin: 0 }}>Pays : {entry.entreprise.pays || "—"}</p>
                        <p style={{ margin: 0 }}>Secteur : {entry.entreprise.secteurActivite || "—"}</p>
                        <p style={{ margin: 0 }}>SIRET : {entry.entreprise.siret || "—"}</p>
                        {entry.entreprise.certifications?.length > 0 && (
                          <p style={{ margin: 0 }}>Certifications : {entry.entreprise.certifications.map((c) => c.nom).join(", ")}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: spacing.sm, flexShrink: 0 }}>
                    {(entry.entreprise?.documents?.length > 0) && (
                      <Button variant="secondary" onClick={() => setDocsModal(entry.entreprise.documents)}>
                        Voir les documents ({entry.entreprise.documents.length})
                      </Button>
                    )}
                    <Button variant="dark" disabled={pendingId === entry.id} onClick={() => handleValidate(entry.id)}>
                      {pendingId === entry.id ? "..." : "Valider"}
                    </Button>
                    <Button variant="secondary" disabled={pendingId === entry.id} onClick={() => { setRejectModal(entry); setMotif(""); }}>
                      Rejeter
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchQueue(p); }} />
        </>
      )}

      {docsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "#fff", width: 720, maxWidth: "94%", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "92vh", overflow: "auto" }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.textPrimary }}>Documents justificatifs</h3>
            {docsModal.length === 0 ? (
              <p style={{ color: colors.textMuted }}>Aucun document.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                {docsModal.map((d) => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.sm }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.nom_document || d.nomFichier}
                      </span>
                      {d.date_upload && <span style={{ fontSize: 12, color: colors.textMuted }}>Déposé le {new Date(d.date_upload).toLocaleDateString("fr-FR")}</span>}
                    </div>
                    <Button variant="secondary" disabled={viewDocLoading} onClick={() => handleViewDoc(d.id)}>
                      {viewDocLoading ? "..." : "Voir"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
              <Button variant="dark" onClick={() => { setDocsModal(null); setViewDocModal(null); }}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {viewDocModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "#fff", width: 860, maxWidth: "94%", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "92vh", overflow: "auto" }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.textPrimary }}>
              {viewDocModal.doc?.nom_document || viewDocModal.doc?.nomFichier || "Aperçu du document"}
            </h3>
            <iframe src={viewDocModal.url} title="Aperçu du document" style={{ width: "100%", height: 420, border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
              <Button variant="secondary" onClick={() => window.open(viewDocModal.url, "_blank", "noopener")}>Ouvrir dans un onglet</Button>
              <Button variant="dark" onClick={() => setViewDocModal(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", width: "420px", maxWidth: "90%", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.textPrimary }}>Rejeter le profil</h3>
            <p style={{ color: colors.textMuted, marginBottom: spacing.md, fontSize: typography.fontSizeSm }}>
              Motif du rejet (obligatoire) :
            </p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: typography.fontSizeBase, resize: "vertical", boxSizing: "border-box" }}
              placeholder="Décrivez la raison du rejet..."
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
              <Button variant="secondary" onClick={() => setRejectModal(null)}>Annuler</Button>
              <Button variant="danger" onClick={handleReject} disabled={!motif.trim() || pendingId === rejectModal.id}>
                {pendingId === rejectModal.id ? "..." : "Confirmer le rejet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
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
