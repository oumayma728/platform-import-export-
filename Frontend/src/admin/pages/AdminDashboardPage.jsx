import { useState, useEffect, useCallback } from "react";
import { getAdminUsers } from "../api/adminUsers";
import { getAdminCompanies } from "../api/adminCompanies";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import AdminFilterBar from "../components/AdminFilterBar";
import Pagination from "../components/Pagination";
import CompanyDocumentsModal from "../components/CompanyDocumentsModal";
import KybModal from "../components/KybModal";

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #ebebea",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "18px",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            fontFamily: "'Sora', sans-serif",
            color: color,
            lineHeight: 1.1,
          }}
        >
          {value ?? "—"}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#9ca3af",
            fontFamily: "'Inter', sans-serif",
            marginTop: "3px",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, total, isLoading }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <h2
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "#14161C",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {!isLoading && total != null && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#9ca3af",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {total} au total
          </span>
        )}
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            fontFamily: "'Inter', sans-serif",
            margin: "4px 0 0",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Colonnes utilisateurs ────────────────────────────────────────────────────
const USER_COLUMNS = [
  { key: "name", label: "Nom" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Téléphone" },
  {
    key: "status",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
  {
    key: "companyId",
    label: "Entreprise",
    render: (val) =>
      val ? (
        <span style={{ color: "#374151", fontSize: "12px" }}>Lié</span>
      ) : (
        <span style={{ color: "#d1d5db", fontSize: "12px" }}>—</span>
      ),
  },
  {
    key: "createdAt",
    label: "Inscription",
    render: (val) =>
      val
        ? new Date(val).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
  },
];

// ─── Colonnes entreprises ─────────────────────────────────────────────────────
const COMPANY_COLUMNS = [
  { key: "name", label: "Entreprise" },
  { key: "country", label: "Pays" },
  {
    key: "sector",
    label: "Secteur",
    render: (val) => val ?? <span style={{ color: "#d1d5db" }}>—</span>,
  },
  {
    key: "activeListings",
    label: "Annonces actives",
    render: (val) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "24px",
          height: "22px",
          padding: "0 8px",
          borderRadius: "6px",
          background: val > 0 ? "#dcfce7" : "#f3f4f6",
          color: val > 0 ? "#15803d" : "#9ca3af",
          fontSize: "12px",
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {val ?? 0}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Créée le",
    render: (val) =>
      val
        ? new Date(val).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
  },
  {
    key: "_docs",
    label: "Justificatifs",
    sortable: false,
  },
  {
    key: "_kyb",
    label: "KYB",
    sortable: false,
  },
];

const EMPTY_FILTERS = {
  status: "",
  country: "",
  sector: "",
  date_from: "",
  date_to: "",
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  // ── State: Users ──
  const [usersData, setUsersData] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [statusCounts, setStatusCounts] = useState(null);
  const [usersFilters, setUsersFilters] = useState({ ...EMPTY_FILTERS, page: 1, limit: 10 });
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  // ── State: Companies ──
  const [companiesData, setCompaniesData] = useState([]);
  const [companiesMeta, setCompaniesMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [companiesFilters, setCompaniesFilters] = useState({ ...EMPTY_FILTERS, page: 1, limit: 10 });
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");

  // ── State: Documents modal ──
  const [selectedDocCompany, setSelectedDocCompany] = useState(null);

  // ── State: KYB modal ──
  const [selectedKybCompany, setSelectedKybCompany] = useState(null);

  // ─── Fetch Users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (filters) => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await getAdminUsers(filters);
      setUsersData(res.data ?? []);
      setUsersMeta({ total: res.total, page: res.page, limit: res.limit });
      setStatusCounts(res.statusCounts ?? null);
    } catch (err) {
      setUsersError(
        err?.response?.data?.message || err?.message || "Erreur lors du chargement des utilisateurs."
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ─── Fetch Companies ───────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async (filters) => {
    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      const res = await getAdminCompanies(filters);
      setCompaniesData(res.data ?? []);
      setCompaniesMeta({ total: res.total, page: res.page, limit: res.limit });
    } catch (err) {
      setCompaniesError(
        err?.response?.data?.message || err?.message || "Erreur lors du chargement des entreprises."
      );
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // Chargement initial et à chaque changement de filtres
  useEffect(() => {
    fetchUsers(usersFilters);
  }, [usersFilters, fetchUsers]);

  useEffect(() => {
    fetchCompanies(companiesFilters);
  }, [companiesFilters, fetchCompanies]);

  // ─── Handlers filtres ──────────────────────────────────────────────────────
  function handleUsersFilterChange(newFilters) {
    setUsersFilters({ ...newFilters, page: 1, limit: 10 });
  }

  function handleUsersFilterReset() {
    setUsersFilters({ ...EMPTY_FILTERS, page: 1, limit: 10 });
  }

  function handleCompaniesFilterChange(newFilters) {
    setCompaniesFilters({ ...newFilters, page: 1, limit: 10 });
  }

  function handleCompaniesFilterReset() {
    setCompaniesFilters({ ...EMPTY_FILTERS, page: 1, limit: 10 });
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: "32px 36px",
        maxWidth: "1300px",
        margin: "0 auto",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── En-tête page ── */}
      <div style={{ marginBottom: "32px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#B8720A",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "6px",
          }}
        >
          Administration
        </p>
        <h1
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            color: "#14161C",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: "6px 0 0" }}>
          Vue d'ensemble des utilisateurs et entreprises inscrits
        </p>
      </div>

      {/* ── KPI Cards (statuts utilisateurs) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        <KpiCard
          label="Validés"
          value={statusCounts?.VALIDE}
          color="#15803d"
          bg="#dcfce7"
          icon="✓"
        />
        <KpiCard
          label="En attente"
          value={statusCounts?.EN_ATTENTE_VALIDATION}
          color="#92400e"
          bg="#fef3c7"
          icon="⏳"
        />
        <KpiCard
          label="Rejetés"
          value={statusCounts?.REJETE}
          color="#991b1b"
          bg="#fee2e2"
          icon="✕"
        />
        <KpiCard
          label="Suspendus"
          value={statusCounts?.SUSPENDU}
          color="#374151"
          bg="#f3f4f6"
          icon="⛔"
        />
      </div>

      {/* ─────────────────────────────── SECTION UTILISATEURS ─────────── */}
      <section style={{ marginBottom: "48px" }}>
        <SectionHeader
          title="Utilisateurs inscrits"
          subtitle="Liste complète des membres de la plateforme"
          total={usersMeta.total}
          isLoading={usersLoading}
        />

        {/* Filtres */}
        <div style={{ marginBottom: "16px" }}>
          <AdminFilterBar
            filters={usersFilters}
            onChange={handleUsersFilterChange}
            onReset={handleUsersFilterReset}
            showSector={false}
          />
        </div>

        {/* Erreur */}
        {usersError && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#991b1b",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚠️ {usersError}
          </div>
        )}

        {/* Tableau */}
        <DataTable
          columns={USER_COLUMNS}
          data={usersData}
          isLoading={usersLoading}
          emptyText="Aucun utilisateur trouvé pour ces critères."
        />

        {/* Pagination */}
        <Pagination
          page={usersMeta.page}
          total={usersMeta.total}
          limit={usersMeta.limit}
          onChange={(p) => setUsersFilters((f) => ({ ...f, page: p }))}
        />
      </section>

      {/* ─────────────────────────────── SECTION ENTREPRISES ─────────── */}
      <section style={{ marginBottom: "48px" }}>
        <SectionHeader
          title="Entreprises"
          subtitle="Usines et sociétés enregistrées sur la plateforme"
          total={companiesMeta.total}
          isLoading={companiesLoading}
        />

        {/* Filtres */}
        <div style={{ marginBottom: "16px" }}>
          <AdminFilterBar
            filters={companiesFilters}
            onChange={handleCompaniesFilterChange}
            onReset={handleCompaniesFilterReset}
            showSector
          />
        </div>

        {/* Erreur */}
        {companiesError && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#991b1b",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚠️ {companiesError}
          </div>
        )}

        {/* Tableau */}
        <DataTable
          columns={COMPANY_COLUMNS}
          data={companiesData.map((c) => ({
            ...c,
            _docs: (
              <button
                onClick={() => setSelectedDocCompany(c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  height: "30px",
                  padding: "0 11px",
                  borderRadius: "7px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontSize: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#14161C";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#14161C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#374151";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Documents
              </button>
            ),
            _kyb: (
              <button
                onClick={() => setSelectedKybCompany(c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  height: "30px",
                  padding: "0 11px",
                  borderRadius: "7px",
                  border: "1px solid #fde68a",
                  background: "#fefce8",
                  fontSize: "12px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  color: "#92400e",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#92400e";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#92400e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fefce8";
                  e.currentTarget.style.color = "#92400e";
                  e.currentTarget.style.borderColor = "#fde68a";
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                KYB
              </button>
            ),
          }))}
          isLoading={companiesLoading}
          emptyText="Aucune entreprise trouvée pour ces critères."
        />

        {/* Pagination */}
        <Pagination
          page={companiesMeta.page}
          total={companiesMeta.total}
          limit={companiesMeta.limit}
          onChange={(p) => setCompaniesFilters((f) => ({ ...f, page: p }))}
        />
      </section>

      {/* ── Modal documents ── */}
      {selectedDocCompany && (
        <CompanyDocumentsModal
          company={selectedDocCompany}
          onClose={() => setSelectedDocCompany(null)}
        />
      )}

      {/* ── Modal KYB ── */}
      {selectedKybCompany && (
        <KybModal
          company={selectedKybCompany}
          onClose={() => setSelectedKybCompany(null)}
          onSuccess={() => fetchCompanies(companiesFilters)}
        />
      )}
    </div>
  );
}
