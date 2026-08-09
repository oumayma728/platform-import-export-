import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate, NavLink } from "react-router-dom";
import { getDashboardStats, getUsers, getEnterprises, getAdminCountries } from "../api/admin";
import { Users, ShieldCheck, Building2, Flag, SearchCheck, Award, Star, History, TrendingUp, Globe, Layers } from "lucide-react";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const ADMIN_SECTIONS = [
  { to: "/admin/users", label: "Utilisateurs", desc: "Gérer les comptes", Icon: Users },
  { to: "/admin/validation", label: "Validation", desc: "Profils en attente", Icon: ShieldCheck },
  { to: "/admin/enterprises", label: "Entreprises", desc: "Annuaire des entreprises", Icon: Building2 },
  { to: "/admin/reports", label: "Signalements", desc: "Contenus signalés", Icon: Flag },
  { to: "/admin/kyb", label: "KYB", desc: "Vérifications d'identité", Icon: SearchCheck },
  { to: "/admin/badges", label: "Badges", desc: "Badges de confiance", Icon: Award },
  { to: "/admin/reviews", label: "Avis", desc: "Avis des utilisateurs", Icon: Star },
  { to: "/admin/history", label: "Historique", desc: "Traçabilité de modération", Icon: History },
];

const USER_STATUS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "validated", label: "Validé" },
  { value: "rejected", label: "Rejeté" },
  { value: "suspended", label: "Suspendu" },
];

const STATUS_TONE = {
  pending: { bg: "#fff7ed", color: "#c2570a", label: "En attente" },
  validated: { bg: "#f0fdf4", color: "#16a34a", label: "Validé" },
  rejected: { bg: "#fef2f2", color: "#c22d2d", label: "Rejeté" },
  suspended: { bg: "#fef2f2", color: "#c22d2d", label: "Suspendu" },
};

function AdminNavCard({ to, label, desc, Icon }) {
  const [hovered, setHovered] = useState(false);
  return (
    <NavLink
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        padding: "24px 18px",
        borderRadius: radius.md,
        border: `1px solid ${hovered ? colors.primary : colors.border}`,
        backgroundColor: "#fff",
        boxShadow: hovered ? shadow.raised : shadow.card,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.18s ease",
        textDecoration: "none",
      }}
    >
      <Icon size={26} color={hovered ? colors.primary : colors.textPrimary} strokeWidth={1.75} style={{ transition: "color 0.18s ease" }} />
      <span style={{ fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>{label}</span>
      <span style={{ fontSize: typography.fontSizeSm, color: colors.textMuted }}>{desc}</span>
    </NavLink>
  );
}

function StatusTag({ status }) {
  const tone = STATUS_TONE[status] || { bg: "#f3f4f6", color: "#4b5563", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 11, fontWeight: 700 }}>
      {tone.label}
    </span>
  );
}

function KpiCard({ Icon, label, value, sub, tone, bg }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600 }}>{label}</p>
        <p style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 800, color: colors.textPrimary, fontFamily: typography.display, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.textMuted }}>{sub}</p>}
      </div>
      <div style={{ width: 46, height: 46, borderRadius: radius.md, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={tone} strokeWidth={2} />
      </div>
    </div>
  );
}

function DonutChart({ data, size = 190, thickness = 26, centerTop, centerBottom }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.neutralBg} strokeWidth={thickness} />
      {data.filter((d) => d.value > 0).map((d, i) => {
        const len = (d.value / total) * circumference;
        const seg = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.tone}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${circumference - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return seg;
      })}
      <text x="50%" y="47%" textAnchor="middle" fontSize="28" fontWeight="800" fill={colors.textPrimary} fontFamily={typography.display}>{centerTop}</text>
      <text x="50%" y="63%" textAnchor="middle" fontSize="11" fill={colors.textMuted}>{centerBottom}</text>
    </svg>
  );
}

function TrendChart({ data }) {
  const w = 640, h = 230, padX = 36, padTop = 18, padBottom = 30;
  const max = Math.max(1, ...data.map((d) => d.count));
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - (d.count / max) * innerH,
    d,
  }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${padTop + innerH} L${padX},${padTop + innerH} Z`;
  const grid = 3;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: grid + 1 }).map((_, i) => {
        const y = padTop + (innerH * i) / grid;
        const val = Math.round(max * (1 - i / grid));
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke={colors.border} strokeDasharray="4 4" strokeWidth="1" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10" fill={colors.textMuted}>{val}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.d.count > 0 ? 3.5 : 2} fill="#fff" stroke={colors.primary} strokeWidth="2" />
          {i % 2 === 0 || i === pts.length - 1 ? (
            <text x={p.x} y={h - 10} textAnchor="middle" fontSize="10" fill={colors.textMuted}>{p.d.date.slice(5)}</text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function BarList({ data, tone = colors.primary }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{d.label}</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{d.value}</span>
          </div>
          <div style={{ background: colors.neutralBg, borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", borderRadius: 999, background: tone, transition: "width 0.6s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  padding: "8px 12px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  fontSize: typography.fontSizeSm,
  color: colors.textPrimary,
  background: "#fff",
};

export default function AdminDashboardPage() {
  const { admin } = useAdmin();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("users");
  const [filters, setFilters] = useState({ statut: "", pays: "", secteur: "", dateDebut: "", dateFin: "" });
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ rows: [], total: 0, totalPages: 1 });
  const [isListLoading, setIsListLoading] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [paysOptions, setPaysOptions] = useState([]);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    getAdminCountries()
      .then(setPaysOptions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsListLoading(true);
    setError(null);
    const params = { page, limit: 10 };
    if (filters.pays) params.pays = filters.pays;
    if (filters.secteur) params.secteur = filters.secteur;
    if (filters.dateDebut) params.dateDebut = `${filters.dateDebut}T00:00:00`;
    if (filters.dateFin) params.dateFin = `${filters.dateFin}T23:59:59`;

    const req = tab === "users"
      ? getUsers({ ...params, status: filters.statut || undefined })
      : getEnterprises({ ...params, statut: filters.statut || undefined });

    req
      .then((data) => setList({ rows: data.users || data.entreprises || [], total: data.total || 0, totalPages: data.totalPages || 1 }))
      .catch((err) => setError(err.message))
      .finally(() => setIsListLoading(false));
  }, [tab, filters, page]);

  if (!admin) return <Navigate to="/admin/login" replace />;

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ statut: "", pays: "", secteur: "", dateDebut: "", dateFin: "" });
  };

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getSortValue = (row, key) => {
    const v = row[key];
    if (v == null) return "";
    if (typeof v === "number") return v;
    if (typeof v === "string") return v.toLowerCase();
    return String(v);
  };

  const sortedRows = sortKey
    ? [...list.rows].sort((a, b) => {
        const va = getSortValue(a, sortKey);
        const vb = getSortValue(b, sortKey);
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : list.rows;

  const thStyle = (key) => ({
    padding: "8px 10px",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    color: sortKey === key ? colors.primary : colors.textMuted,
  });

  const sortArrow = (key) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Tableau de bord
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Pilotez la modération, les vérifications et la confiance de la plateforme.
        </p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <>
          <h2 style={{ fontSize: typography.fontSizeLg, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.md }}>
            Sections
          </h2>
          <div className="grid-3-col" style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            {ADMIN_SECTIONS.map((section) => (
              <AdminNavCard key={section.to} {...section} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
            <h2 style={{ fontSize: typography.fontSizeLg, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Statistiques
            </h2>
            <span style={{ fontSize: 12, color: colors.textMuted }}>Taux de validation {stats.validationRate}%</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: spacing.md, marginBottom: spacing.lg }}>
            <KpiCard Icon={Users} label="Utilisateurs totaux" value={stats.totalUsers} sub={`${stats.registrations.reduce((s, r) => s + r.count, 0)} inscriptions (14 j)`} tone={colors.primary} bg={colors.primarySoft} />
            <KpiCard Icon={ShieldCheck} label="En attente de validation" value={stats.pendingValidation} sub={`${stats.validated} validés · ${stats.rejected} rejetés`} tone={colors.info} bg={colors.infoBg} />
            <KpiCard Icon={Building2} label="Entreprises" value={stats.totalEntreprises} sub={`${stats.totalAnnonces} annonces actives`} tone={colors.success} bg={colors.successBg} />
            <KpiCard Icon={Flag} label="Signalements en attente" value={stats.pendingReports} sub={`${stats.totalReports} au total`} tone={colors.danger} bg={colors.dangerBg} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1fr)", gap: spacing.md, marginBottom: spacing.lg }}>
            <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                <TrendingUp size={18} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>Inscriptions — 14 derniers jours</h3>
              </div>
              <TrendChart data={stats.registrations} />
            </div>

            <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
              <h3 style={{ margin: 0, marginBottom: spacing.md, fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>Statut des profils</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
                <DonutChart
                  data={[
                    { value: stats.pendingValidation, tone: colors.info },
                    { value: stats.validated, tone: colors.success },
                    { value: stats.rejected, tone: colors.danger },
                    { value: stats.suspended, tone: colors.neutral },
                  ]}
                  centerTop={stats.totalUsers}
                  centerBottom="Profils"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "En attente", value: stats.pendingValidation, tone: colors.info },
                  { label: "Validés", value: stats.validated, tone: colors.success },
                  { label: "Rejetés", value: stats.rejected, tone: colors.danger },
                  { label: "Suspendus", value: stats.suspended, tone: colors.neutral },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textPrimary }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: s.tone, display: "inline-block" }} />
                      {s.label}
                    </span>
                    <span style={{ color: colors.textMuted }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: spacing.md, marginBottom: spacing.lg }}>
            <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                <Globe size={18} color={colors.info} />
                <h3 style={{ margin: 0, fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>Top pays d'origine</h3>
              </div>
              {stats.topCountries.length ? <BarList data={stats.topCountries.map((c) => ({ label: c.label, value: c.count }))} tone={colors.info} /> : <p style={{ color: colors.textMuted, fontSize: 13 }}>Aucune donnée.</p>}
            </div>

            <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                <Layers size={18} color={colors.success} />
                <h3 style={{ margin: 0, fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>Secteurs d'activité</h3>
              </div>
              {stats.topSectors.length ? <BarList data={stats.topSectors.map((s) => ({ label: s.label, value: s.count }))} tone={colors.success} /> : <p style={{ color: colors.textMuted, fontSize: 13 }}>Aucune donnée.</p>}
            </div>

            <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                <Award size={18} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>Score de confiance</h3>
              </div>
              {stats.trustScores ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: spacing.md }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, fontFamily: typography.display }}>{stats.trustScores.avg}</span>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>/ 100 · {stats.trustScores.count} entreprises évaluées</span>
                  </div>
                  <BarList data={Object.entries(stats.trustScores.bins).map(([label, value]) => ({ label, value }))} tone={colors.primary} />
                </>
              ) : (
                <p style={{ color: colors.textMuted, fontSize: 13 }}>Aucune donnée.</p>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: typography.fontSizeLg, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.md }}>
            Listes &amp; filtres
          </h2>
          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.lg, boxShadow: shadow.card }}>
            <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.md, flexWrap: "wrap" }}>
              <button onClick={() => { setTab("users"); setPage(1); }} style={{ padding: "8px 16px", borderRadius: radius.sm, border: `1px solid ${tab === "users" ? colors.primary : colors.border}`, background: tab === "users" ? colors.primarySoft : "#fff", color: tab === "users" ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                Utilisateurs inscrits
              </button>
              <button onClick={() => { setTab("enterprises"); setPage(1); }} style={{ padding: "8px 16px", borderRadius: radius.sm, border: `1px solid ${tab === "enterprises" ? colors.primary : colors.border}`, background: tab === "enterprises" ? colors.primarySoft : "#fff", color: tab === "enterprises" ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                Usines / entreprises
              </button>
              <button onClick={resetFilters} style={{ padding: "8px 16px", borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "#fff", color: colors.textMuted, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                Réinitialiser
              </button>
            </div>

            <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginBottom: spacing.md }}>
              <select value={filters.statut} onChange={(e) => setFilter("statut", e.target.value)} style={inputStyle}>
                {USER_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={filters.pays} onChange={(e) => setFilter("pays", e.target.value)} style={inputStyle}>
                <option value="">Tous les pays</option>
                {paysOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={filters.secteur} onChange={(e) => setFilter("secteur", e.target.value)} placeholder="Secteur (ex: Textile)" style={inputStyle} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textMuted }}>
                Du <input type="date" value={filters.dateDebut} onChange={(e) => setFilter("dateDebut", e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textMuted }}>
                Au <input type="date" value={filters.dateFin} onChange={(e) => setFilter("dateFin", e.target.value)} style={inputStyle} />
              </label>
            </div>

            {isListLoading ? <Spinner /> : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: typography.fontSizeSm }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>
                        {tab === "users" ? (
                          <>
                            <th style={thStyle("nom")} onClick={() => setSort("nom")}>Nom{sortArrow("nom")}</th>
                            <th style={thStyle("email")} onClick={() => setSort("email")}>Email{sortArrow("email")}</th>
                            <th style={thStyle("validationStatus")} onClick={() => setSort("validationStatus")}>Statut{sortArrow("validationStatus")}</th>
                            <th style={thStyle("companyName")} onClick={() => setSort("companyName")}>Entreprise{sortArrow("companyName")}</th>
                            <th style={thStyle("country")} onClick={() => setSort("country")}>Pays{sortArrow("country")}</th>
                            <th style={thStyle("sector")} onClick={() => setSort("sector")}>Secteur{sortArrow("sector")}</th>
                            <th style={thStyle("createdAt")} onClick={() => setSort("createdAt")}>Inscrit le{sortArrow("createdAt")}</th>
                          </>
                        ) : (
                          <>
                            <th style={thStyle("nom")} onClick={() => setSort("nom")}>Entreprise{sortArrow("nom")}</th>
                            <th style={thStyle("pays")} onClick={() => setSort("pays")}>Pays{sortArrow("pays")}</th>
                            <th style={thStyle("secteur")} onClick={() => setSort("secteur")}>Secteur{sortArrow("secteur")}</th>
                            <th style={thStyle("role")} onClick={() => setSort("role")}>Rôle{sortArrow("role")}</th>
                            <th style={thStyle("nombreAnnoncesActives")} onClick={() => setSort("nombreAnnoncesActives")}>Annonces actives{sortArrow("nombreAnnoncesActives")}</th>
                            <th style={thStyle("trustScore")} onClick={() => setSort("trustScore")}>Trust score{sortArrow("trustScore")}</th>
                            <th style={thStyle("createdAt")} onClick={() => setSort("createdAt")}>Créée le{sortArrow("createdAt")}</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.length === 0 ? (
                        <tr><td colSpan="7" style={{ padding: 20, textAlign: "center", color: colors.textMuted }}>Aucun résultat pour ces filtres.</td></tr>
                      ) : tab === "users" ? sortedRows.map((u) => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: "8px 10px", fontWeight: 600 }}>{u.prenom} {u.nom}</td>
                          <td style={{ padding: "8px 10px" }}>{u.email}</td>
                          <td style={{ padding: "8px 10px" }}><StatusTag status={u.validationStatus} /></td>
                          <td style={{ padding: "8px 10px" }}>{u.companyName || "—"}</td>
                          <td style={{ padding: "8px 10px" }}>{u.country || "—"}</td>
                          <td style={{ padding: "8px 10px" }}>{u.sector || "—"}</td>
                          <td style={{ padding: "8px 10px", color: colors.textMuted }}>{u.createdAt?.split("T")[0]}</td>
                        </tr>
                      )) : sortedRows.map((e) => (
                        <tr key={e.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: "8px 10px", fontWeight: 600 }}>{e.nom}</td>
                          <td style={{ padding: "8px 10px" }}>{e.pays || "—"}</td>
                          <td style={{ padding: "8px 10px" }}>{e.secteur || "—"}</td>
                          <td style={{ padding: "8px 10px" }}>{e.role}</td>
                          <td style={{ padding: "8px 10px" }}>{e.nombreAnnoncesActives}</td>
                          <td style={{ padding: "8px 10px" }}>{e.trustScore != null ? `${e.trustScore}/100` : "—"}</td>
                          <td style={{ padding: "8px 10px", color: colors.textMuted }}>{e.createdAt?.split("T")[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{list.total} résultat(s) — Page {page}/{list.totalPages}</span>
                  <div style={{ display: "flex", gap: spacing.sm }}>
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ ...inputStyle, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>← Précédent</button>
                    <button disabled={page >= list.totalPages} onClick={() => setPage((p) => p + 1)} style={{ ...inputStyle, cursor: page >= list.totalPages ? "not-allowed" : "pointer", opacity: page >= list.totalPages ? 0.5 : 1 }}>Suivant →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
