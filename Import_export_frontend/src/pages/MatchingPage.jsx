import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRobot,
  FaBoxOpen,
  FaDollarSign,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaClock,
  FaCommentDots,
  FaBuilding,
  FaUserTie,
} from "react-icons/fa";

import { useResourceList } from "../hooks/useResourceList";
import { getMatches } from "../api/matches";
import { getOrCreateConversation } from "../features/messaging/api/messages";
import { getPublicAccount } from "../api/accounts";
import AsyncState from "../components/organisms/AsyncState";
import { colors, radius, shadow, spacing, typography } from "../styles/tokens";

const ROLE_LABEL = {
  importer: "Importateur",
  exporter: "Exportateur",
};

// Chaque clé de `reasons` correspond à un critère évalué par l'agent IA.
const REASON_META = {
  product: { icon: <FaBoxOpen />, label: "Produit" },
  price: { icon: <FaDollarSign />, label: "Prix" },
  location: { icon: <FaMapMarkerAlt />, label: "Localisation" },
  reliability: { icon: <FaShieldAlt />, label: "Fiabilité" },
  deadline: { icon: <FaClock />, label: "Délai" },
};

const SCORE_FIELD_OPTIONS = [
  { value: "", label: "Tous les scores" },
  { value: "80", label: "80 et plus" },
  { value: "60", label: "60 et plus" },
];

function scoreColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.info;
  return colors.neutral;
}

export default function MatchingPage() {
  const navigate = useNavigate();

  // useResourceList appelle getMatches(filters) à chaque changement de
  // filtres -> GET /matching-results?minScore=... côté vraie API.
  const { items: matches, filters, setFilters, isLoading, error } =
    useResourceList(getMatches, {});

  const [contactingId, setContactingId] = useState(null);
  const [contactError, setContactError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [ownerAccount, setOwnerAccount] = useState(null);
  const [isOwnerAccountLoading, setIsOwnerAccountLoading] = useState(false);

  // Dès qu'on ouvre le détail d'une correspondance, on va chercher le profil
  // public complet de l'entreprise (secteur, certifications, description...)
  // en plus des infos déjà connues (nom, pays) portées par le match lui-même.
  useEffect(() => {
    if (!selectedMatch?.counterpart?.ownerId) {
      setOwnerAccount(null);
      return;
    }

    let isCancelled = false;
    setIsOwnerAccountLoading(true);
    setOwnerAccount(null);

    getPublicAccount(selectedMatch.counterpart.ownerId)
      .then((account) => {
        if (!isCancelled) setOwnerAccount(account);
      })
      .catch(() => {
        if (!isCancelled) setOwnerAccount(null);
      })
      .finally(() => {
        if (!isCancelled) setIsOwnerAccountLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedMatch?.counterpart?.ownerId]);

  async function handleContact(match) {
    setContactingId(match.id);
    setContactError(null);
    try {
      // On identifie la conversation par l'annonce RÉELLE du partenaire
      // (celle qu'il propose), pas la vôtre — cohérent avec "Voir l'annonce
      // du partenaire", et ça évite qu'un même produit chez vous mélange les
      // conversations de plusieurs partenaires différents.
      const conversation = await getOrCreateConversation(
        match.counterpartListing?.id || match.listingId,
        match.counterpartListing || match.listing,
        match.counterpart
      );
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      setContactError(
        err.message || "Impossible de contacter cette correspondance pour le moment."
      );
    } finally {
      setContactingId(null);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: spacing.md,
          marginBottom: spacing.xl,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "38px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <FaRobot color={colors.primary} />
            Matching IA
          </h1>

          <p style={{ marginTop: "8px", color: colors.textMuted }}>
            Les correspondances que notre agent IA a identifiées pour vos
            annonces, triées par score de pertinence.
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
          Score minimum
          <select
            value={filters.minScore || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minScore: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              fontSize: 14,
              backgroundColor: "#fff",
            }}
          >
            {SCORE_FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {contactError && (
        <p
          style={{
            color: colors.danger,
            marginBottom: spacing.md,
            fontSize: 14,
          }}
        >
          {contactError}
        </p>
      )}

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={matches.length === 0}
        emptyLabel="Aucune correspondance trouvée pour le moment. Revenez plus tard : l'agent IA analyse en continu le catalogue."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing.lg,
          }}
        >
          {matches.map((match) => {
            const isContacting = contactingId === match.id;

            return (
              <div
                key={match.id}
                style={{
                  backgroundColor: "#fff",
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  boxShadow: shadow.card,
                }}
              >
                {/* HEADER : score + contrepartie + annonce concernée */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: spacing.md,
                    marginBottom: spacing.md,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: typography.fontSizeMd,
                      }}
                    >
                      {match.counterpart?.name || "Entreprise partenaire"}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: colors.textMuted,
                        fontSize: typography.fontSizeBase,
                      }}
                    >
                      {match.counterpart?.country && (
                        <>🌍 {match.counterpart.country} · </>
                      )}
                      Correspond à votre annonce «{" "}
                      {match.listing?.product || "Annonce"} »
                    </p>
                  </div>

                  {/* SCORE */}
                  <div style={{ textAlign: "right", minWidth: "160px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          color: scoreColor(match.matchScore),
                        }}
                      >
                        {match.matchScore}%
                      </span>
                      <span style={{ fontSize: 13, color: colors.textMuted }}>
                        de pertinence
                      </span>
                    </div>

                    <div
                      style={{
                        width: "160px",
                        height: "8px",
                        borderRadius: "999px",
                        backgroundColor: colors.neutralBg,
                        overflow: "hidden",
                        marginLeft: "auto",
                      }}
                    >
                      <div
                        style={{
                          width: `${match.matchScore}%`,
                          height: "100%",
                          backgroundColor: scoreColor(match.matchScore),
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* DETAIL : raisons du match */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: spacing.sm,
                    marginBottom: spacing.md,
                  }}
                >
                  {Object.entries(REASON_META).map(([key, meta]) => {
                    const reasonText = match.reasons?.[key];
                    if (!reasonText) return null;

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: spacing.sm,
                          backgroundColor: colors.surface,
                          borderRadius: radius.sm,
                        }}
                      >
                        <div
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            marginTop: 2,
                          }}
                        >
                          {meta.icon}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 700,
                              color: colors.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            {meta.label}
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 13.5,
                              color: colors.textPrimary,
                            }}
                          >
                            {reasonText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ACTIONS : voir le détail complet / contacter cette correspondance */}
                <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setSelectedMatch(match)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 18px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.sm,
                      backgroundColor: "#fff",
                      color: colors.textPrimary,
                      fontWeight: 600,
                      fontSize: typography.fontSizeSm,
                      cursor: "pointer",
                    }}
                  >
                    🔍 Voir le détail
                  </button>

                  <button
                    onClick={() => handleContact(match)}
                    disabled={isContacting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 18px",
                      border: "none",
                      borderRadius: radius.sm,
                      backgroundColor: colors.primary,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: typography.fontSizeSm,
                      cursor: isContacting ? "not-allowed" : "pointer",
                      opacity: isContacting ? 0.7 : 1,
                    }}
                  >
                    <FaCommentDots />
                    {isContacting ? "Connexion..." : "Contacter"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AsyncState>

      {/* MODAL DÉTAIL : explication complète du match */}
      {selectedMatch && (
        <div
          onClick={() => setSelectedMatch(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: spacing.md,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "560px",
              maxWidth: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              borderRadius: "20px",
              padding: spacing.xl,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: typography.fontSizeLg }}>
                  {selectedMatch.counterpart?.name || "Entreprise partenaire"}
                </h3>
                <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: typography.fontSizeBase }}>
                  {selectedMatch.counterpart?.country && (
                    <>🌍 {selectedMatch.counterpart.country} · </>
                  )}
                  Correspond à votre annonce «{" "}
                  {selectedMatch.listing?.product || "Annonce"} »
                </p>

              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                aria-label="Fermer"
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: colors.textMuted,
                }}
              >
                ×
              </button>
            </div>

            {/* Profil complet de l'entreprise partenaire : emplacement,
                secteur, certifications, description. */}
            {(isOwnerAccountLoading || ownerAccount) && (
              <div
                style={{
                  padding: spacing.md,
                  borderRadius: radius.sm,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  marginBottom: spacing.lg,
                }}
              >
                {isOwnerAccountLoading ? (
                  <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                    Chargement du profil de l'entreprise...
                  </p>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: spacing.sm }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#4f46e5,#4338ca)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        <FaBuilding />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 15, color: colors.textPrimary }}>
                            {ownerAccount.companyName}
                          </strong>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 10px",
                              borderRadius: "999px",
                              background: "#eef2ff",
                              color: colors.primary,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <FaUserTie />
                            {ROLE_LABEL[ownerAccount.role] || ownerAccount.role}
                          </span>
                          {ownerAccount.profileStatus === "validated" && (
                            <span style={{ fontSize: 12, fontWeight: 600, color: colors.success }}>
                              ✅ Profil validé
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: 13 }}>
                          🌍 {ownerAccount.country}
                          {ownerAccount.sector && <> · {ownerAccount.sector}</>}
                          {ownerAccount.memberSince && <> · Membre depuis {ownerAccount.memberSince}</>}
                        </p>
                      </div>
                    </div>

                    {ownerAccount.certifications?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: spacing.sm }}>
                        {ownerAccount.certifications.map((cert) => (
                          <span
                            key={cert}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: "999px",
                              background: "#f0fdf4",
                              color: colors.success,
                            }}
                          >
                            ✅ {cert}
                          </span>
                        ))}
                      </div>
                    )}

                    {ownerAccount.description && (
                      <p style={{ margin: 0, color: colors.textPrimary, fontSize: 14, lineHeight: 1.5 }}>
                        {ownerAccount.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Score */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: scoreColor(selectedMatch.matchScore),
                }}
              >
                {selectedMatch.matchScore}%
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: colors.textMuted }}>
                  Score de pertinence global
                </p>
                <div
                  style={{
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: colors.neutralBg,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${selectedMatch.matchScore}%`,
                      height: "100%",
                      backgroundColor: scoreColor(selectedMatch.matchScore),
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Explication complète, critère par critère */}
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginBottom: spacing.xl }}>
              {Object.entries(REASON_META).map(([key, meta]) => {
                const reasonText = selectedMatch.reasons?.[key];
                if (!reasonText) return null;

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: spacing.md,
                      backgroundColor: colors.surface,
                      borderRadius: radius.sm,
                    }}
                  >
                    <div style={{ color: colors.primary, fontSize: 18, marginTop: 2 }}>
                      {meta.icon}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {meta.label}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 14, color: colors.textPrimary }}>
                        {reasonText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedMatch(null)}
                style={{
                  padding: "10px 18px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm,
                  background: "#fff",
                  color: colors.textPrimary,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>

              {selectedMatch.counterpartListing && (
                <button
                  onClick={() => {
                    navigate(`/listings/${selectedMatch.counterpartListing.id}`);
                    setSelectedMatch(null);
                  }}
                  style={{
                    padding: "10px 18px",
                    border: `1px solid ${colors.primary}`,
                    borderRadius: radius.sm,
                    background: "#fff",
                    color: colors.primary,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  📄 Voir l'annonce du partenaire
                </button>
              )}

              <button
                onClick={() => handleContact(selectedMatch)}
                disabled={contactingId === selectedMatch.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: radius.sm,
                  backgroundColor: colors.primary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: contactingId === selectedMatch.id ? "not-allowed" : "pointer",
                  opacity: contactingId === selectedMatch.id ? 0.7 : 1,
                }}
              >
                <FaCommentDots />
                {contactingId === selectedMatch.id ? "Connexion..." : "Contacter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}