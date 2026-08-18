import { useState, useEffect, useCallback } from "react";
import { getPendingCompanies } from "../api/adminCompanies";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import ValidationModal from "../components/ValidationModal";
import CompanyDocumentsModal from "../components/CompanyDocumentsModal";
import KybModal from "../components/KybModal";

// ─── Colonnes du tableau ───────────────────────────────────────────────────
const COLUMNS = [
  {
    key: "name",
    label: "Entreprise",
    render: (val) => (
      <span style={{ fontWeight: 600, color: "#14161C", fontFamily: "'Inter', sans-serif" }}>
        {val}
      </span>
    ),
  },
  {
    key: "country",
    label: "Pays",
  },
  {
    key: "sector",
    label: "Secteur",
    render: (val) =>
      val ?? <span style={{ color: "#d1d5db", fontStyle: "italic" }}>Non renseigné</span>,
  },
  {
    key: "createdAt",
    label: "Date d'inscription",
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
  {
    key: "_action",
    label: "Action",
    sortable: false,
  },
];

// ─── Page principale ───────────────────────────────────────────────────────
export default function PendingCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Modal validation
  const [selectedCompany, setSelectedCompany] = useState(null);
  // Modal documents
  const [selectedDocCompany, setSelectedDocCompany] = useState(null);
  // Modal KYB
  const [selectedKybCompany, setSelectedKybCompany] = useState(null);

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchPending = useCallback(async (p = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getPendingCompanies(p, 10);
      setCompanies(res.data ?? []);
      setMeta({ total: res.total, page: res.page, limit: res.limit });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Impossible de charger la file d'attente."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending(page);
  }, [page, fetchPending]);

  // Après action réussie : fermer modal + recharger la liste
  function handleActionSuccess() {
    setSelectedCompany(null);
    fetchPending(page);
  }

  // Enrichir les données avec les colonnes Action et Justificatifs
  const enrichedData = companies.map((company) => ({
    ...company,
    _docs: (
      <button
        onClick={() => setSelectedDocCompany(company)}
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
        onClick={() => setSelectedKybCompany(company)}
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
    _action: (
      <button
        onClick={() => setSelectedCompany(company)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: "32px",
          padding: "0 12px",
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Examiner
      </button>
    ),
  }));

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: "32px 36px",
        maxWidth: "1300px",
        margin: "0 auto",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── En-tête ── */}
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
          Modération
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
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
            File d'attente de validation
          </h1>

          {/* Badge compteur */}
          {!isLoading && meta.total > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                fontSize: "13px",
                fontWeight: 700,
                color: "#92400e",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#d97706",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              {meta.total} en attente
            </span>
          )}

          {!isLoading && meta.total === 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                fontSize: "13px",
                fontWeight: 600,
                color: "#15803d",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ✓ File vide
            </span>
          )}
        </div>
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: "6px 0 0" }}>
          Entreprises en attente de validation — triées par date d'inscription (les plus anciennes en priorité)
        </p>
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "13px",
            color: "#991b1b",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Tableau ── */}
      <DataTable
        columns={COLUMNS}
        data={enrichedData}
        isLoading={isLoading}
        emptyText="Aucune entreprise en attente de validation. La file est vide."
      />

      {/* ── Pagination ── */}
      <Pagination
        page={meta.page}
        total={meta.total}
        limit={meta.limit}
        onChange={(p) => setPage(p)}
      />

      {/* ── Modal Valider / Rejeter ── */}
      {selectedCompany && (
        <ValidationModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* ── Modal Documents ── */}
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
          onSuccess={() => fetchPending(page)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
