import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import {
  getTrustBadges,
  revokeBadge,
  getBadgeDefinitions,
  createBadgeDefinition,
  deleteBadgeDefinition,
  awardBadgeDefinition,
  getEnterprises,
} from "../api/admin";
import Button from "../../../components/atoms/Button";
import Spinner from "../../../components/atoms/Spinner";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const inputStyle = {
  padding: "8px 12px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  fontSize: typography.fontSizeSm,
  color: colors.textPrimary,
  background: "#fff",
  boxSizing: "border-box",
};

export default function AdminBadgesPage() {
  const { admin } = useAdmin();
  const isSuper = admin?.role === "superadmin";

  const [badges, setBadges] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  // formulaire création
  const [form, setForm] = useState({ code: "", nom: "", description: "", criteres: "{}" });
  // formulaire attribution
  const [award, setAward] = useState({ badgeId: "", entrepriseId: "" });

  const fetchBadges = () => {
    setIsLoading(true);
    getTrustBadges()
      .then(setBadges)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  const fetchDefinitions = () => {
    getBadgeDefinitions()
      .then(setDefinitions)
      .catch(() => {});
  };

  const fetchEnterprises = () => {
    getEnterprises({ limit: 100 })
      .then((data) => setEnterprises(data.entreprises || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchBadges();
    fetchDefinitions();
    fetchEnterprises();
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (!admin) return <Navigate to="/admin/login" replace />;

  async function handleRevoke(badgeId) {
    setPendingId(badgeId);
    try {
      await revokeBadge(badgeId);
      setSuccessMsg("Badge révoqué");
      fetchBadges();
      fetchDefinitions();
    } catch (err) { setError(err.message); }
    finally { setPendingId(null); }
  }

  async function handleCreate() {
    if (!form.code || !form.nom) { setError("Le code et le nom sont obligatoires."); return; }
    let criteres = {};
    try { criteres = JSON.parse(form.criteres || "{}"); }
    catch { setError("Le JSON des critères est invalide."); return; }
    setError(null);
    try {
      await createBadgeDefinition({ code: form.code, nom: form.nom, description: form.description || null, criteres });
      setSuccessMsg("Définition de badge créée");
      setForm({ code: "", nom: "", description: "", criteres: "{}" });
      fetchDefinitions();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(badgeId) {
    setPendingId(badgeId);
    try {
      await deleteBadgeDefinition(badgeId);
      setSuccessMsg("Définition supprimée");
      fetchDefinitions();
    } catch (err) { setError(err.message); }
    finally { setPendingId(null); }
  }

  async function handleAward() {
    if (!award.badgeId || !award.entrepriseId) { setError("Sélectionnez un badge et une entreprise."); return; }
    setError(null);
    try {
      await awardBadgeDefinition({ badgeId: award.badgeId, entrepriseId: award.entrepriseId });
      setSuccessMsg("Badge attribué à l'entreprise");
      setAward({ badgeId: "", entrepriseId: "" });
      fetchBadges();
      fetchDefinitions();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Badges de confiance
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Attribués aux entreprises, ils renforcent la confiance sur la plateforme.
        </p>
      </div>

      {successMsg && <MessageBanner tone="success">{successMsg}</MessageBanner>}
      {error && <MessageBanner tone="danger">{error}</MessageBanner>}

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
        {/* Attribution */}
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
          <h3 style={{ marginTop: 0, marginBottom: spacing.md, color: colors.textPrimary }}>Attribuer un badge</h3>
          <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
              Badge
              <select value={award.badgeId} onChange={(e) => setAward({ ...award, badgeId: e.target.value })} style={inputStyle}>
                <option value="">— Choisir —</option>
                {definitions.map((d) => <option key={d.id} value={d.id}>{d.nom} ({d.code})</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
              Entreprise
              <select value={award.entrepriseId} onChange={(e) => setAward({ ...award, entrepriseId: e.target.value })} style={{ ...inputStyle, minWidth: 220 }}>
                <option value="">— Choisir —</option>
                {enterprises.map((e) => <option key={e.id} value={e.id}>{e.nom} ({e.pays || "?"})</option>)}
              </select>
            </label>
            <Button onClick={handleAward}>Attribuer</Button>
          </div>
        </div>

        {/* Définitions */}
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
          <h3 style={{ marginTop: 0, marginBottom: spacing.md, color: colors.textPrimary }}>
            Définitions de badges {isSuper ? "" : "(réservé au superadmin)"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.md }}>
            {definitions.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 13 }}>Aucune définition. Créez-en une ci-dessous.</p>
            ) : definitions.map((d) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: colors.surfaceRaised }}>
                <div>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                    <Tag>{d.code}</Tag>
                    <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase }}>{d.nom}</span>
                  </div>
                  {d.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted }}>{d.description}</p>}
                  {Object.keys(d.criteres || {}).length > 0 && (
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Critères : {JSON.stringify(d.criteres)}</p>
                  )}
                </div>
                {isSuper && (
                  <Button variant="danger" disabled={pendingId === d.id} onClick={() => handleDelete(d.id)}>
                    {pendingId === d.id ? "..." : "Supprimer"}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isSuper && (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code (ex: TOP_EXPORTATEUR)" style={inputStyle} />
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom (ex: Top Exportateur)" style={inputStyle} />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" style={inputStyle} />
              <textarea value={form.criteres} onChange={(e) => setForm({ ...form, criteres: e.target.value })} rows={2} placeholder='Critères JSON (ex: {"min_trust_score": 80, "kyb_verified": true})' style={{ ...inputStyle, resize: "vertical" }} />
              <div><Button onClick={handleCreate}>Créer la définition</Button></div>
            </div>
          )}
        </div>

        {/* Badges actifs (legacy) */}
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
          <h3 style={{ marginTop: 0, marginBottom: spacing.md, color: colors.textPrimary }}>Badges attribués</h3>
          {isLoading ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              {badges.length === 0 ? (
                <p style={{ color: colors.textMuted }}>Aucun badge actif.</p>
              ) : badges.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm }}>
                  <div>
                    <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                      <Tag>{b.badgeType}</Tag>
                      <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase }}>{b.entrepriseNom}</span>
                    </div>
                    {b.description && <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeSm, color: colors.textMuted }}>{b.description}</p>}
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Obtenu le {b.dateObtention?.split("T")[0]}</p>
                  </div>
                  <Button variant="danger" disabled={pendingId === b.id} onClick={() => handleRevoke(b.id)}>
                    {pendingId === b.id ? "..." : "Révoquer"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      color: colors.primary,
      fontWeight: 700,
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
