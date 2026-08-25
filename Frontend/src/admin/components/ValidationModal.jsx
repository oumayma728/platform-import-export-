import { useState } from "react";
import { validateCompany, rejectCompany } from "../api/adminCompanies";


export default function ValidationModal({ company, onClose, onSuccess }) {
  const [motif, setMotif] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState(null); // "validate" | "reject"

  if (!company) return null;

  const canReject = motif.trim().length > 0;

  async function handleAction(type) {
    setIsLoading(true);
    setError("");
    setAction(type);
    try {
      if (type === "validate") {
        await validateCompany(company.id, { motif: motif.trim() || undefined });
      } else {
        await rejectCompany(company.id, { motif: motif.trim() });
      }
      onSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Une erreur s'est produite. Réessayez.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  }

  
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
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
    maxWidth: "480px",
    animation: "slideUp 0.2s ease",
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* ── Header ── */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid #f0f0ee",
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
                Décision de validation
              </p>
              <h2
                id="modal-title"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#14161C",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {company.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
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
                flexShrink: 0,
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

          {/* Infos entreprise */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            {[
              { icon: "🌍", label: company.country },
              { icon: "🏭", label: company.sector ?? "Secteur non renseigné" },
            ].map((item, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  background: "#f9f9f8",
                  border: "1px solid #ebebea",
                  fontSize: "12px",
                  color: "#374151",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                {item.icon} {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Corps : Motif ── */}
        <div style={{ padding: "20px 28px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              fontFamily: "'Inter', sans-serif",
              marginBottom: "8px",
            }}
          >
            Motif
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#9ca3af",
                background: "#f3f4f6",
                padding: "1px 7px",
                borderRadius: "9999px",
              }}
            >
              optionnel pour Valider · requis pour Rejeter
            </span>
          </label>
          <textarea
            id="validation-motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Documents KYB non conformes, adresse non vérifiable..."
            disabled={isLoading}
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1.5px solid #e5e7eb",
              background: "#fafaf9",
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              color: "#14161C",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#B8720A")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
          {/* Indication manque motif pour Rejeter */}
          {!canReject && motif === "" && (
            <p style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "'Inter', sans-serif", margin: "6px 0 0" }}>
              ℹ️ Un motif est obligatoire pour rejeter une entreprise.
            </p>
          )}
        </div>

        {/* ── Erreur API ── */}
        {error && (
          <div
            style={{
              margin: "0 28px",
              padding: "10px 14px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#991b1b",
              fontFamily: "'Inter', sans-serif",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Footer : Actions ── */}
        <div
          style={{
            padding: "20px 28px 24px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            borderTop: "1px solid #f0f0ee",
            marginTop: "20px",
          }}
        >
          {/* Annuler */}
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "transparent",
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              color: "#374151",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#f9f9f8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Annuler
          </button>

          {/* Rejeter */}
          <button
            onClick={() => handleAction("reject")}
            disabled={isLoading || !canReject}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "none",
              background: isLoading && action === "reject" ? "#f87171" : !canReject ? "#fca5a5" : "#dc2626",
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              color: "#fff",
              cursor: isLoading || !canReject ? "not-allowed" : "pointer",
              opacity: !canReject && motif !== "" ? 0.5 : 1,
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => canReject && !isLoading && (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => canReject && !isLoading && (e.currentTarget.style.background = "#dc2626")}
          >
            {isLoading && action === "reject" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Rejet en cours…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Rejeter
              </>
            )}
          </button>

          {/* Valider */}
          <button
            onClick={() => handleAction("validate")}
            disabled={isLoading}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "none",
              background: isLoading && action === "validate" ? "#4ade80" : "#16a34a",
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#15803d")}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = "#16a34a")}
          >
            {isLoading && action === "validate" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Validation…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Valider
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
