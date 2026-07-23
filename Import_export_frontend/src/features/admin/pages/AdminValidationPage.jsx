import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getValidationQueue, validateUser, rejectUser } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

export default function AdminValidationPage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [motif, setMotif] = useState("");
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchQueue = () => {
    setIsLoading(true);
    getValidationQueue()
      .then(setQueue)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchQueue(); }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

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

  if (isLoading) return <p style={{ color: colors.textMuted }}>Chargement...</p>;

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        File d'attente de validation
      </h1>

      {successMsg && (
        <div style={{ padding: "12px 16px", borderRadius: radius.md, backgroundColor: colors.successBg, color: colors.success, fontWeight: 600, marginBottom: spacing.md }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: radius.md, backgroundColor: colors.dangerBg, color: colors.danger, fontWeight: 600, marginBottom: spacing.md }}>
          {error}
        </div>
      )}

      {queue.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun profil en attente de validation.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {queue.map((entry) => (
            <div key={entry.id} style={{
              background: colors.surfaceRaised,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: spacing.lg,
              boxShadow: shadow.card,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: typography.fontSizeMd, fontWeight: 700 }}>
                    {entry.prenom} {entry.nom}
                  </h3>
                  <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>{entry.email}</p>
                  {entry.entreprise && (
                    <div style={{ marginTop: spacing.sm, fontSize: typography.fontSizeSm, color: colors.textMuted }}>
                      <p style={{ margin: 0 }}>Entreprise : {entry.entreprise.nom}</p>
                      <p style={{ margin: 0 }}>Pays : {entry.entreprise.pays || "—"}</p>
                      <p style={{ margin: 0 }}>Secteur : {entry.entreprise.secteurActivite || "—"}</p>
                      <p style={{ margin: 0 }}>SIRET : {entry.entreprise.siret || "—"}</p>
                      {entry.entreprise.certifications?.length > 0 && (
                        <p style={{ margin: 0 }}>Certifications : {entry.entreprise.certifications.map(c => c.nom).join(", ")}</p>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: spacing.sm, flexShrink: 0 }}>
                  <button
                    disabled={pendingId === entry.id}
                    onClick={() => handleValidate(entry.id)}
                    style={{
                      padding: "8px 16px", border: "none", borderRadius: radius.sm,
                      backgroundColor: colors.success, color: "#fff", fontWeight: 600,
                      cursor: pendingId === entry.id ? "not-allowed" : "pointer",
                      opacity: pendingId === entry.id ? 0.6 : 1,
                    }}
                  >
                    {pendingId === entry.id ? "..." : "Valider"}
                  </button>
                  <button
                    disabled={pendingId === entry.id}
                    onClick={() => { setRejectModal(entry); setMotif(""); }}
                    style={{
                      padding: "8px 16px", border: `1px solid ${colors.danger}`, borderRadius: radius.sm,
                      backgroundColor: "#fff", color: colors.danger, fontWeight: 600,
                      cursor: pendingId === entry.id ? "not-allowed" : "pointer",
                    }}
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", width: "420px", maxWidth: "90%", borderRadius: radius.lg, padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: spacing.sm, color: colors.textPrimary }}>Rejeter le profil</h3>
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
              <button onClick={() => setRejectModal(null)} style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleReject} disabled={!motif.trim() || pendingId === rejectModal.id} style={{ padding: "8px 16px", border: "none", borderRadius: radius.sm, backgroundColor: colors.danger, color: "#fff", fontWeight: 600, cursor: motif.trim() ? "pointer" : "not-allowed", opacity: motif.trim() ? 1 : 0.5 }}>
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
