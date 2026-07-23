import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getEnterprises } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

export default function AdminEnterprisesPage() {
  const { user } = useAuth();
  const [entreprises, setEntreprises] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchData = (p = page, s = search) => {
    setIsLoading(true);
    const params = { page: p, limit: 20 };
    if (s) params.search = s;
    getEnterprises(params)
      .then((data) => { setEntreprises(data.entreprises); setTotal(data.total); setTotalPages(data.totalPages); })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1, ""); }, []);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  function handleSearch(e) { e.preventDefault(); setPage(1); fetchData(1, search); }

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Entreprises
      </h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg }}>
        <input type="text" placeholder="Rechercher par nom, SIRET..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: typography.fontSizeBase }} />
        <button type="submit" style={{ padding: "10px 20px", border: "none", borderRadius: radius.sm, backgroundColor: colors.primary, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Rechercher</button>
      </form>

      {error && <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.dangerBg, color: colors.danger, marginBottom: spacing.md }}>{error}</div>}

      {isLoading ? <p style={{ color: colors.textMuted }}>Chargement...</p> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} entreprise(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {entreprises.map((e) => (
              <div key={e.id} style={{ background: colors.surfaceRaised, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.sm }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: typography.fontSizeMd }}>{e.nom}</span>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                      {e.pays} · {e.secteur || "—"} · {e.role} · SIRET: {e.siret || "—"}
                    </p>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                      {e.nombreAnnoncesActives} annonce(s) active(s)
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
                    {e.badges?.map((b, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: radius.full, backgroundColor: colors.primarySoft, color: colors.primary, fontWeight: 600 }}>{b}</span>
                    ))}
                    {e.certifications?.map((c, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: radius.full, backgroundColor: colors.infoBg, color: colors.info, fontWeight: 600 }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center", marginTop: spacing.lg }}>
              <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchData(p, search); }}
                style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer" }}>Précédent</button>
              <span style={{ padding: "8px 12px", fontSize: typography.fontSizeSm, color: colors.textMuted }}>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); fetchData(p, search); }}
                style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer" }}>Suivant</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
