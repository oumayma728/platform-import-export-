import { useState, useEffect } from "react";
import { assignBadge, getCompanyReviewsSummary } from "../api/adminCompanies";

// ─── Types de badges disponibles ─────────────────────────────────────────────
const BADGE_TYPES = [
  {
    value: "ENTREPRISE_VERIFIEE",
    label: "Entreprise Vérifiée",
    icon: "✅",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
  },
  {
    value: "TOP_EXPORTATEUR",
    label: "Top Exportateur",
    icon: "🏆",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fde68a",
  },
  {
    value: "CERTIFIEE",
    label: "Certifiée",
    icon: "📋",
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#bfdbfe",
  },
  {
    value: "PARTENAIRE_PREMIUM",
    label: "Partenaire Premium",
    icon: "💎",
    color: "#6d28d9",
    bg: "#ede9fe",
    border: "#ddd6fe",
  },
];

// ─── Composant étoile ─────────────────────────────────────────────────────────
function StarRating({ value }) {
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const half   = !filled && value >= star - 0.5;
        return (
          <svg key={star} width="18" height="18" viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`half-${star}`}>
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={filled ? "#f59e0b" : half ? `url(#half-${star})` : "#e5e7eb"}
              stroke={filled || half ? "#f59e0b" : "#d1d5db"}
              strokeWidth="1"
            />
          </svg>
        );
      })}
    </div>
  );
}

/**
 * Modal combiné Avis + Attribution de badge avec affichage des badges actifs.
 *
 * Props:
 *   company   {Object}   - { id, name }
 *   onClose   {function} - Fermer le modal
 */
export default function BadgesReviewsModal({ company, onClose }) {
  // ── Avis ──
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviews, setReviews] = useState(null); // { averageRating, reviewCount }
  const [reviewsError, setReviewsError] = useState("");

  // ── Badges attribués ──
  const [awardedBadges, setAwardedBadges] = useState(() => {
    if (!company?.id) return [];
    try {
      const saved = localStorage.getItem(`company_badges_${company.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // ── Formulaire d'attribution ──
  const [selectedBadge, setSelectedBadge] = useState(BADGE_TYPES[0].value);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeError, setBadgeError] = useState("");
  const [badgeSuccess, setBadgeSuccess] = useState("");

  // Recharger badges sauvegardés si changement d'entreprise
  useEffect(() => {
    if (!company?.id) return;
    try {
      const saved = localStorage.getItem(`company_badges_${company.id}`);
      if (saved) {
        setAwardedBadges(JSON.parse(saved));
        return;
      }
    } catch {
      // fallback
    }
    setAwardedBadges([]);
  }, [company?.id]);

  // ─── Charger les avis à l'ouverture ──────────────────────────────────────
  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    async function fetchReviews() {
      setReviewsLoading(true);
      setReviewsError("");
      try {
        const res = await getCompanyReviewsSummary(company.id);
        if (!cancelled) setReviews(res);
      } catch (err) {
        if (!cancelled) {
          setReviewsError(
            err?.response?.data?.message ||
            err?.message ||
            "Impossible de charger les avis."
          );
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }
    fetchReviews();
    return () => { cancelled = true; };
  }, [company?.id]);

  if (!company) return null;

  // ─── Attribuer un badge ───────────────────────────────────────────────────
  async function handleAssignBadge() {
    setBadgeLoading(true);
    setBadgeError("");
    setBadgeSuccess("");
    try {
      await assignBadge(company.id, { badgeType: selectedBadge });
      
      const found = BADGE_TYPES.find((b) => b.value === selectedBadge);
      setBadgeSuccess(`Badge "${found?.label}" attribué avec succès !`);

      // Mettre à jour la liste des badges attribués
      setAwardedBadges((prev) => {
        const updated = prev.includes(selectedBadge) ? prev : [...prev, selectedBadge];
        try {
          localStorage.setItem(`company_badges_${company.id}`, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    } catch (err) {
      console.error("[BADGE] Erreur :", err?.response ?? err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de l'attribution. Vérifiez la console.";
      setBadgeError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setBadgeLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
        animation: "brFadeIn 0.15s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="br-modal-title"
        style={{
          background: "#fff", borderRadius: "14px",
          border: "1px solid #ebebea",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)",
          width: "100%", maxWidth: "490px",
          maxHeight: "90vh", overflowY: "auto",
          animation: "brSlideUp 0.2s ease",
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
                Avis & Badges
              </p>
              <h2 id="br-modal-title" style={{
                fontFamily: "'Sora', sans-serif", fontSize: "17px",
                fontWeight: 700, color: "#14161C", margin: 0, letterSpacing: "-0.01em",
              }}>
                {company.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#9ca3af", padding: "4px", borderRadius: "6px",
                display: "flex", alignItems: "center", transition: "color 0.15s",
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

        {/* ── Section 1 : Résumé des avis ── */}
        <div style={{ padding: "18px 26px", borderBottom: "1px solid #f0f0ee" }}>
          <p style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "#9ca3af",
            fontFamily: "'Inter', sans-serif", marginBottom: "12px",
          }}>
            Avis des utilisateurs
          </p>

          {/* Chargement — skeleton */}
          {reviewsLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[1, 2].map((i) => (
                <div key={i} style={{
                  height: "28px", borderRadius: "6px",
                  background: "linear-gradient(90deg, #f0f0ee 25%, #e8e8e6 50%, #f0f0ee 75%)",
                  backgroundSize: "200% 100%",
                  animation: "brShimmer 1.4s infinite",
                }} />
              ))}
            </div>
          )}

          {/* Erreur */}
          {!reviewsLoading && reviewsError && (
            <div style={{
              padding: "10px 14px", background: "#fee2e2",
              border: "1px solid #fecaca", borderRadius: "8px",
              fontSize: "13px", color: "#991b1b", fontFamily: "'Inter', sans-serif",
              display: "flex", gap: "8px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {reviewsError}
            </div>
          )}

          {/* Avis chargés */}
          {!reviewsLoading && !reviewsError && reviews && (
            <>
              {reviews.reviewCount === 0 ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", background: "#fafaf9",
                  borderRadius: "8px", border: "1px solid #ebebea",
                }}>
                  <span style={{ fontSize: "18px" }}>⭐</span>
                  <p style={{ fontSize: "13px", color: "#6b7280", fontFamily: "'Inter', sans-serif", margin: 0 }}>
                    Aucun avis pour le moment
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "#fafaf9", border: "1px solid #ebebea",
                  borderRadius: "10px", padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: "16px",
                }}>
                  {/* Note chiffre */}
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{
                      fontSize: "28px", fontWeight: 700,
                      fontFamily: "'Sora', sans-serif", color: "#14161C", lineHeight: 1,
                    }}>
                      {reviews.averageRating !== null ? reviews.averageRating.toFixed(1) : "—"}
                    </div>
                    <div style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "'Inter', sans-serif", marginTop: "2px" }}>
                      sur 5
                    </div>
                  </div>

                  {/* Étoiles + nombre d'avis */}
                  <div style={{ flex: 1 }}>
                    <StarRating value={reviews.averageRating ?? 0} />
                    <p style={{
                      fontSize: "12px", color: "#6b7280",
                      fontFamily: "'Inter', sans-serif", margin: "4px 0 0",
                      fontWeight: 500,
                    }}>
                      {reviews.reviewCount} avis client{reviews.reviewCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Section 2 : Badges attribués (Actifs) ── */}
        <div style={{ padding: "18px 26px", borderBottom: "1px solid #f0f0ee", background: "#fcfcfb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#9ca3af",
              fontFamily: "'Inter', sans-serif", margin: 0,
            }}>
              Badges attribués ({awardedBadges.length})
            </p>
          </div>

          {awardedBadges.length === 0 ? (
            <p style={{
              fontSize: "12px", color: "#9ca3af", fontFamily: "'Inter', sans-serif",
              fontStyle: "italic", margin: 0,
            }}>
              Aucun badge attribué à cette entreprise pour l'instant.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {awardedBadges.map((badgeVal) => {
                const badgeInfo = BADGE_TYPES.find((b) => b.value === badgeVal) || {
                  label: badgeVal,
                  icon: "🏅",
                  color: "#374151",
                  bg: "#f3f4f6",
                  border: "#e5e7eb",
                };
                return (
                  <div
                    key={badgeVal}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      background: badgeInfo.bg,
                      border: `1px solid ${badgeInfo.border}`,
                      color: badgeInfo.color,
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      animation: "brPop 0.2s ease",
                    }}
                  >
                    <span>{badgeInfo.icon}</span>
                    <span>{badgeInfo.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 3 : Attribuer un nouveau badge ── */}
        <div style={{ padding: "20px 26px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "#9ca3af",
            fontFamily: "'Inter', sans-serif", marginBottom: "12px",
          }}>
            Attribuer un nouveau badge
          </p>

          {/* Dropdown */}
          <div style={{ marginBottom: "14px" }}>
            <label
              htmlFor="badge-select"
              style={{
                display: "block", fontSize: "12px", fontWeight: 600,
                color: "#374151", fontFamily: "'Inter', sans-serif", marginBottom: "6px",
              }}
            >
              Sélectionner le badge
            </label>
            <select
              id="badge-select"
              value={selectedBadge}
              onChange={(e) => {
                setSelectedBadge(e.target.value);
                setBadgeSuccess("");
                setBadgeError("");
              }}
              disabled={badgeLoading}
              style={{
                width: "100%", height: "40px",
                padding: "0 12px",
                borderRadius: "8px", border: "1.5px solid #e5e7eb",
                background: "#fafaf9", fontSize: "13px",
                fontFamily: "'Inter', sans-serif", color: "#14161C",
                cursor: badgeLoading ? "not-allowed" : "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "36px",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#B8720A")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            >
              {BADGE_TYPES.map((b) => {
                const isAwarded = awardedBadges.includes(b.value);
                return (
                  <option key={b.value} value={b.value}>
                    {b.icon} {b.label} {isAwarded ? "✓ (Déjà attribué)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Feedback badge erreur */}
          {badgeError && (
            <div style={{
              padding: "10px 14px", background: "#fee2e2",
              border: "1px solid #fecaca", borderRadius: "8px",
              fontSize: "13px", color: "#991b1b",
              fontFamily: "'Inter', sans-serif",
              display: "flex", gap: "8px", marginBottom: "14px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {badgeError}
            </div>
          )}

          {/* Feedback badge succès */}
          {badgeSuccess && (
            <div style={{
              padding: "10px 14px", background: "#f0fdf4",
              border: "1px solid #bbf7d0", borderRadius: "8px",
              fontSize: "13px", color: "#15803d",
              fontFamily: "'Inter', sans-serif",
              display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {badgeSuccess}
            </div>
          )}

          {/* Bouton attribuer */}
          <button
            onClick={handleAssignBadge}
            disabled={badgeLoading}
            style={{
              width: "100%", height: "40px",
              borderRadius: "8px", border: "none",
              background: badgeLoading ? "#9ca3af" : "#14161C",
              fontSize: "13px", fontFamily: "'Inter', sans-serif",
              fontWeight: 600, color: "#fff",
              cursor: badgeLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => !badgeLoading && (e.currentTarget.style.background = "#374151")}
            onMouseLeave={(e) => !badgeLoading && (e.currentTarget.style.background = "#14161C")}
          >
            {badgeLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: "brSpin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Attribution en cours…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M8 14l-3 7h14l-3-7" />
                </svg>
                Attribuer ce badge
              </>
            )}
          </button>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 26px 20px", borderTop: "1px solid #f0f0ee",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              height: "36px", padding: "0 16px", borderRadius: "8px",
              border: "1px solid #e5e7eb", background: "transparent",
              fontSize: "13px", fontFamily: "'Inter', sans-serif",
              fontWeight: 500, color: "#374151", cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes brFadeIn  { from { opacity: 0; }                              to { opacity: 1; } }
        @keyframes brSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes brSpin    { to { transform: rotate(360deg); } }
        @keyframes brShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes brPop     { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
