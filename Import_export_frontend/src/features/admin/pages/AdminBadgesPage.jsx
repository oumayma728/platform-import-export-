import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getTrustBadges, revokeBadge } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

export default function AdminBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchBadges = () => {
    setIsLoading(true);
    getTrustBadges()
      .then(setBadges)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchBadges(); }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  async function handleRevoke(badgeId) {
    try {
      await revokeBadge(badgeId);
      setSuccessMsg("Badge révoqué");
      fetchBadges();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Badges de confiance
      </h1>

      {successMsg && (
        <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.successBg, color: colors.success, fontWeight: 600, marginBottom: spacing.md }}>{successMsg}</div>
      )}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.dangerBg, color: colors.danger, fontWeight: 600, marginBottom: spacing.md }}>{error}</div>
      )}

      {isLoading ? <p style={{ color: colors.textMuted }}>Chargement...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {badges.length === 0 ? (
            <p style={{ color: colors.textMuted }}>Aucun badge actif.</p>
          ) : badges.map((b) => (
            <div key={b.id} style={{ background: colors.surfaceRaised, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm }}>
              <div>
                <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: radius.full, backgroundColor: colors.primarySoft, color: colors.primary, fontWeight: 700 }}>{b.badgeType}</span>
                  <span style={{ fontWeight: 600 }}>{b.entrepriseNom}</span>
                </div>
                {b.description && <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeSm, color: colors.textMuted }}>{b.description}</p>}
                <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Obtenu le {b.dateObtention?.split("T")[0]}</p>
              </div>
              <button onClick={() => handleRevoke(b.id)} style={{ padding: "5px 12px", border: `1px solid ${colors.danger}`, borderRadius: radius.sm, background: "#fff", color: colors.danger, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                Révoquer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
