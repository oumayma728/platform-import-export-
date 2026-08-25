import { useState, useEffect } from "react";
import { getCompanyDocuments } from "../api/adminCompanies";


export default function CompanyDocumentsModal({ company, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;

    async function fetchDocs() {
      setIsLoading(true);
      setError("");
      try {
        const res = await getCompanyDocuments(company.id);
        if (cancelled) return;
        setDocuments(res.documents ?? []);
        setCompanyName(res.companyName ?? company.name);
        setTotal(res.total ?? 0);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Impossible de charger les documents."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchDocs();
    return () => { cancelled = true; };
  }, [company?.id]);

  if (!company) return null;

  

  function getFileIcon(nom) {
    const lower = (nom ?? "").toLowerCase();
    if (lower.includes("pdf") || lower.includes("registre") || lower.includes("commerce")) {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.75">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="12" y2="17" />
        </svg>
      );
    }
    if (lower.includes("image") || lower.includes("photo") || lower.includes("jpg") || lower.includes("png")) {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.75">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    }
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
    animation: "fadeIn 0.15s ease",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #ebebea",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "620px",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    animation: "slideUp 0.2s ease",
    overflow: "hidden",
  };

  
  return (
    <div
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="docs-modal-title">

        {/* ── Header ── */}
        <div
          style={{
            padding: "22px 26px 18px",
            borderBottom: "1px solid #f0f0ee",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "#B8720A",
                  fontFamily: "'Inter', sans-serif",
                  margin: "0 0 5px",
                }}
              >
                Justificatifs
              </p>
              <h2
                id="docs-modal-title"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#14161C",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {companyName}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Badge total documents */}
              {!isLoading && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    background: total > 0 ? "#f0fdf4" : "#f3f4f6",
                    border: `1px solid ${total > 0 ? "#bbf7d0" : "#e5e7eb"}`,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: total > 0 ? "#15803d" : "#6b7280",
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {total} document{total > 1 ? "s" : ""}
                </span>
              )}

              {/* Bouton fermer */}
              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Corps scrollable ── */}
        <div style={{ overflowY: "auto", padding: "18px 26px 24px", flex: 1 }}>

          {/* Chargement — skeleton */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "76px",
                    borderRadius: "10px",
                    background: "linear-gradient(90deg, #f0f0ee 25%, #e8e8e6 50%, #f0f0ee 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
              ))}
            </div>
          )}

          {/* Erreur */}
          {!isLoading && error && (
            <div
              style={{
                padding: "14px 16px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                fontSize: "13px",
                color: "#991b1b",
                fontFamily: "'Inter', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Etat vide */}
          {!isLoading && !error && documents.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#9ca3af",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1.5"
                style={{ marginBottom: "14px", display: "block", margin: "0 auto 14px" }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", margin: "0 0 4px" }}>
                Aucun document soumis
              </p>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                Cette entreprise n'a pas encore téléversé de justificatifs.
              </p>
            </div>
          )}

          {/* Galerie des documents */}
          {!isLoading && !error && documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {documents.map((doc, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #ebebea",
                    background: "#fafaf9",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ebebea")}
                >
                  {/* Icône */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "8px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(doc.nom_document)}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#14161C",
                        fontFamily: "'Inter', sans-serif",
                        margin: "0 0 3px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {doc.nom_document}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        fontFamily: "'Inter', sans-serif",
                        margin: 0,
                      }}
                    >
                      Soumis le {formatDate(doc.date_upload)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {/* Ouvrir / Prévisualiser */}
                    <a
                      href={doc.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Prévisualiser dans un nouvel onglet"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        height: "32px",
                        padding: "0 12px",
                        borderRadius: "7px",
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        fontSize: "12px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        color: "#374151",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
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
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ouvrir
                    </a>

                    {/* Télécharger */}
                    <a
                      href={doc.downloadUrl}
                      download
                      title="Télécharger le document"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        height: "32px",
                        padding: "0 12px",
                        borderRadius: "7px",
                        border: "none",
                        background: "#14161C",
                        fontSize: "12px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        color: "#fff",
                        textDecoration: "none",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#14161C")}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
