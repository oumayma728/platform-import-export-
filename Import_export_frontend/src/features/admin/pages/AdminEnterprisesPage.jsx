import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getEnterprises } from "../api/admin";
import Input from "../../../components/atoms/Input";
import Button from "../../../components/atoms/Button";
import Pagination from "../../../components/molecules/Pagination";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

export default function AdminEnterprisesPage() {
  const { admin } = useAdmin();
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

  if (!admin) return <Navigate to="/admin/login" replace />;

  function handleSearch(e) { e.preventDefault(); setPage(1); fetchData(1, search); }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Entreprises
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Consultez l'annuaire des entreprises inscrites.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            type="text"
            placeholder="Rechercher par nom, SIRET..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit">Rechercher</Button>
      </form>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} entreprise(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {entreprises.map((e) => (
              <div key={e.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.sm }}>
                  <div>
                    <Link to={`/admin/enterprises/${e.id}`} style={{ textDecoration: "none" }}>
                      <span style={{ fontWeight: 700, fontSize: typography.fontSizeMd, color: colors.textPrimary, textDecoration: "underline", textDecorationColor: "transparent", textUnderlineOffset: 3 }}>
                        {e.nom}
                      </span>
                    </Link>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                      {e.pays} · {e.secteur || "—"} · {e.role} · SIRET: {e.siret || "—"}
                    </p>
                    <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                      {e.nombreAnnoncesActives} annonce(s) active(s) · Score de confiance : <strong>{e.trustScore != null ? e.trustScore : "—"}</strong>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {e.badges?.map((b, i) => (
                      <Tag key={`b-${i}`} tone="primary">{b}</Tag>
                    ))}
                    {e.certifications?.map((c, i) => (
                      <Tag key={`c-${i}`} tone="info">{c}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchData(p, search); }} />
        </>
      )}
    </div>
  );
}

function Tag({ children, tone }) {
  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: radius.full,
      backgroundColor: tone === "info" ? colors.infoBg : colors.primarySoft,
      color: tone === "info" ? colors.info : colors.primary,
      fontWeight: 600,
    }}>
      {children}
    </span>
  );
}
