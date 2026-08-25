import { useState, useEffect } from "react";
import { kybVerify } from "../api/adminCompanies";


const KYB_CRITERIA = [
  {
    key: "siret",
    label: "Numéro SIRET / Registre de commerce",
    description: "Numéro d'identification officiel de l'entreprise auprès des autorités.",
  },
  {
    key: "immatriculation_consulaire",
    label: "Immatriculation consulaire",
    description: "Inscription valide auprès du consulat ou chambre de commerce compétente.",
  },
  {
    key: "certification_iso",
    label: "Certification ISO ou équivalent",
    description: "Certification qualité reconnue internationalement (ISO 9001, etc.).",
  },
];


function deriveStatus(verifiedCount, total) {
  if (verifiedCount === 0) return "REJETE";
  if (verifiedCount === total) return "VALIDE";
  return "EN_ATTENTE";
}


export default function KybModal({ company, onClose, onSuccess }) {
  const [checklist, setChecklist] = useState(() => {
    if (!company?.id) return KYB_CRITERIA.map((c) => ({ ...c, verified: false }));
    try {
      const saved = localStorage.getItem(`kyb_checklist_${company.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return KYB_CRITERIA.map((c) => ({ ...c, verified: false }));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  
  useEffect(() => {
    if (!company?.id) return;
    try {
      const saved = localStorage.getItem(`kyb_checklist_${company.id}`);
      if (saved) {
        setChecklist(JSON.parse(saved));
        return;
      }
    } catch {
      // fallback
    }
    setChecklist(KYB_CRITERIA.map((c) => ({ ...c, verified: false })));
  }, [company?.id]);

  if (!company) return null;

  const verifiedCount = checklist.filter((c) => c.verified).length;
  const total = checklist.length;
  const score = total > 0 ? Math.round((verifiedCount / total) * 10000) / 100 : 0;
  const autoStatus = deriveStatus(verifiedCount, total);

  function getScoreColor() {
    if (score >= 100) return "#16a34a";
    if (score >= 50)  return "#d97706";
    return "#dc2626";
  }

  function getScoreBg() {
    if (score >= 100) return "#f0fdf4";
    if (score >= 50)  return "#fffbeb";
    return "#fef2f2";
  }

  const statusMeta = {
    VALIDE:     { label: "Vérifié",     color: "#15803d", bg: "#dcfce7" },
    EN_ATTENTE: { label: "Partiel",     color: "#92400e", bg: "#fef3c7" },
    REJETE:     { label: "Non vérifié", color: "#991b1b", bg: "#fee2e2" },
  }[autoStatus];

  
  function toggleCriteria(key) {
    if (isLoading) return;
    setChecklist((prev) =>
      prev.map((c) => (c.key === key ? { ...c, verified: !c.verified } : c))
    );
  }

  
  async function handleSubmit() {
    setIsLoading(true);
    setError("");

    const payload = {
      status: autoStatus,
      checklistItems: checklist.map(({ key, label, verified }) => ({ key, label, verified })),
    };

    try {
      await kybVerify(company.id, payload);
      try {
        localStorage.setItem(`kyb_checklist_${company.id}`, JSON.stringify(checklist));
      } catch {
        // ignorer en cas de storage restreint
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("[KYB] Erreur vérification :", err?.response ?? err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur serveur. Vérifiez la console pour plus de détails.";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px", animation: "kybFadeIn 0.15s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <div
        role="dialog" aria-modal="true" aria-labelledby="kyb-title"
        style={{
          background: "#fff", borderRadius: "14px",
          border: "1px solid #ebebea",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)",
          width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto",
          animation: "kybSlideUp 0.2s ease",
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid #f0f0ee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div>
              <p style={{
                fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: "#B8720A",
                fontFamily: "'Inter', sans-serif", margin: "0 0 5px",
              }}>
                Vérification KYB
              </p>
              <h2 id="kyb-title" style={{
                fontFamily: "'Sora', sans-serif", fontSize: "17px",
                fontWeight: 700, color: "#14161C", margin: 0, letterSpacing: "-0.01em",
              }}>
                {company.name}
              </h2>
            </div>
            <button
              onClick={() => !isLoading && onClose()}
              aria-label="Fermer"
              style={{
                background: "none", border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                color: "#9ca3af", padding: "4px", borderRadius: "6px",
                display: "flex", alignItems: "center", transition: "color 0.15s",
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.color = "#374151")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Corps ── */}
        <div style={{ padding: "20px 26px" }}>

          {/* Score temps réel */}
          <div style={{
            background: getScoreBg(),
            border: `1px solid ${getScoreColor()}30`,
            borderRadius: "10px", padding: "14px 16px", marginBottom: "22px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <p style={{
                  fontSize: "12px", fontWeight: 600, color: getScoreColor(),
                  fontFamily: "'Inter', sans-serif", margin: "0 0 4px",
                }}>
                  {verifiedCount} / {total} critères validés
                </p>
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: "9999px",
                  background: statusMeta.bg, fontSize: "11px", fontWeight: 700,
                  color: statusMeta.color, fontFamily: "'Inter', sans-serif",
                }}>
                  Statut KYB : {statusMeta.label}
                </span>
              </div>
              <span style={{
                fontSize: "26px", fontWeight: 700, fontFamily: "'Sora', sans-serif",
                color: getScoreColor(), lineHeight: 1,
              }}>
                {score.toFixed(0)}%
              </span>
            </div>

            {/* Barre de progression */}
            <div style={{
              height: "6px", borderRadius: "9999px",
              background: "rgba(0,0,0,0.08)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${score}%`,
                background: getScoreColor(), borderRadius: "9999px",
                transition: "width 0.3s ease, background-color 0.3s ease",
              }} />
            </div>
          </div>

          {/* Checklist */}
          <p style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "#9ca3af",
            fontFamily: "'Inter', sans-serif", marginBottom: "10px",
          }}>
            Critères à vérifier
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {checklist.map((criterion) => (
              <div
                key={criterion.key}
                onClick={() => toggleCriteria(criterion.key)}
                role="checkbox"
                aria-checked={criterion.verified}
                tabIndex={isLoading ? -1 : 0}
                onKeyDown={(e) => e.key === " " && toggleCriteria(criterion.key)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "12px 14px", borderRadius: "9px",
                  border: `1.5px solid ${criterion.verified ? "#86efac" : "#e5e7eb"}`,
                  background: criterion.verified ? "#f0fdf4" : "#fafaf9",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease", userSelect: "none",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: "18px", height: "18px", borderRadius: "5px",
                  border: `2px solid ${criterion.verified ? "#16a34a" : "#d1d5db"}`,
                  background: criterion.verified ? "#16a34a" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "1px", transition: "all 0.15s ease",
                }}>
                  {criterion.verified && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "13px", fontWeight: 600, color: "#14161C",
                    fontFamily: "'Inter', sans-serif", margin: "0 0 2px",
                  }}>
                    {criterion.label}
                  </p>
                  <p style={{
                    fontSize: "11px", color: "#9ca3af",
                    fontFamily: "'Inter', sans-serif", margin: 0, lineHeight: 1.5,
                  }}>
                    {criterion.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div style={{
            margin: "0 26px 16px", padding: "12px 14px",
            background: "#fee2e2", border: "1px solid #fecaca",
            borderRadius: "8px", fontSize: "13px", color: "#991b1b",
            fontFamily: "'Inter', sans-serif",
            display: "flex", gap: "8px", alignItems: "flex-start",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ flexShrink: 0, marginTop: "1px" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 26px 22px", borderTop: "1px solid #f0f0ee",
          display: "flex", gap: "10px", justifyContent: "flex-end",
        }}>
          <button
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
            style={{
              height: "38px", padding: "0 16px", borderRadius: "8px",
              border: "1px solid #e5e7eb", background: "transparent",
              fontSize: "13px", fontFamily: "'Inter', sans-serif",
              fontWeight: 500, color: "#374151",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#f9f9f8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Annuler
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              height: "38px", padding: "0 18px", borderRadius: "8px",
              border: "none",
              background: isLoading ? "#9ca3af" : "#14161C",
              fontSize: "13px", fontFamily: "'Inter', sans-serif",
              fontWeight: 600, color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "7px",
              transition: "background 0.15s ease",
              minWidth: "190px", justifyContent: "center",
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#374151")}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = "#14161C")}
          >
            {isLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: "kybSpin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Enregistrer la vérification
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes kybFadeIn  { from { opacity: 0; }                              to { opacity: 1; } }
        @keyframes kybSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kybSpin    { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
