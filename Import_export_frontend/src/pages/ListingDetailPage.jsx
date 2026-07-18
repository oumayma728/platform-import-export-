import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getListingById } from "../api/listings";
import { useResourceItem } from "../hooks/useResourceItem";
import { getOrCreateConversation } from "../features/messaging/api/messages";
import { getPublicAccount } from "../api/accounts";
import { useAuth } from "../context/AuthContext";
import {
  isListingFavorited,
  toggleFavorite,
} from "../api/favorites";
import { isImageAttachment, getAttachmentUrl } from "../utils/attachments";
import { formatRoleLabel } from "../utils/roles";
import AsyncState from "../components/organisms/AsyncState";
import DetailCard from "../components/molecules/DetailCard";

import {
  FaBox,
  FaDollarSign,
  FaGlobe,
  FaTruck,
  FaCalendarAlt,
  FaCertificate,
  FaHeart,
  FaRegHeart,
  FaBuilding,
  FaUserTie,
} from "react-icons/fa";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isContactingLoading, setIsContactingLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);

const {
  item: listing,
  isLoading,
  error,
} = useResourceItem(
  getListingById,
  id
);

const { user } = useAuth();

const isMyListing =
  listing?.ownerId === user?.id;

  const [ownerAccount, setOwnerAccount] = useState(null);
  const [isOwnerAccountLoading, setIsOwnerAccountLoading] = useState(false);

  // Charge les infos publiques du compte (importateur/exportateur)
  // propriétaire de l'annonce, pour les afficher avant/pendant le contact.
  useEffect(() => {
    let isMounted = true;
    if (!listing?.ownerId || isMyListing) {
      setOwnerAccount(null);
      return;
    }

    setIsOwnerAccountLoading(true);
    getPublicAccount(listing.ownerId)
      .then((account) => {
        if (isMounted) setOwnerAccount(account);
      })
      .catch(() => {
        // Silencieux : l'absence d'infos de compte ne bloque pas le contact
      })
      .finally(() => {
        if (isMounted) setIsOwnerAccountLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listing?.ownerId, isMyListing]);

  // Charge l'état favori courant dès que l'annonce est identifiée
  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    isListingFavorited(id)
      .then((value) => {
        if (isMounted) setIsFavorite(value);
      })
      .catch(() => {
        // Silencieux : l'absence de statut favori ne bloque pas l'affichage
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleToggleFavorite() {
    if (!listing) return;

    setIsFavoriteLoading(true);
    setFavoriteError(null);
    try {
      const result = await toggleFavorite(id, isFavorite);
      setIsFavorite(result.isFavorite);
    } catch (err) {
      setFavoriteError(
        err.message || "Impossible de mettre à jour les favoris."
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  async function handleContact() {
    if (!listing) return;
    
    setIsContactingLoading(true);
    try {
      // Créer une conversation avec le vendeur, en utilisant les vraies
      // infos de son compte (nom d'entreprise, pays, rôle) quand elles sont
      // disponibles, plutôt qu'un libellé générique.
      const conversation = await getOrCreateConversation(
        id,
        listing,
        {
          name: ownerAccount?.companyName || "Vendeur",
          country: ownerAccount?.country || listing.country,
          role: ownerAccount?.role,
        }
      );
      
      // Naviguer vers la messagerie avec cette conversation
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error("Erreur lors du contact:", err);
    } finally {
      setIsContactingLoading(false);
    }
  }

  function getDocumentTypeLabel(type) {
    const labels = {
      photo: "📸 Photo produit",
      technical_sheet: "📄 Fiche technique",
      certificate: "✅ Certification",
      lab_report: "🧪 Analyse laboratoire",
      brochure: "📚 Brochure commerciale",
      other: "📎 Autre document",
    };

    return labels[type] || "📎 Document";
  }

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* RETOUR */}

        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/listings");
            }
          }}
          style={{
            border: "none",
            background: "none",
            color: "#B8720A",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "25px",
            padding: 0,
            fontSize: "16px",
          }}
        >
          ← Retour
        </button>

        <AsyncState
          isLoading={isLoading}
          error={error}
        >
          {listing && (
            <>
              {/* HEADER */}

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "24px",
                  padding: "35px",
                  marginBottom: "30px",
                  textAlign: "center",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.05)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <h1
                  style={{
                    fontSize: "42px",
                    fontWeight: "700",
                    color: "#14161C",
                    marginBottom: "10px",
                  }}
                >
                  {listing.product}
                </h1>

                <p
                  style={{
                    color: "#6B6D76",
                    margin: 0,
                  }}
                >
                  Détails de l'annonce
                </p>
              </div>

              {/* INFORMATIONS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                }}
              >
                <DetailCard
                  icon={<FaBox />}
                  title="Quantité"
                  value={
                    listing.quantityUnit
                      ? `${listing.quantity} ${listing.quantityUnit}`
                      : listing.quantity
                  }
                />

                <DetailCard
                  icon={<FaDollarSign />}
                  title="Prix"
                  value={
                    listing.currency
                      ? `${listing.price} ${listing.currency}`
                      : listing.price
                  }
                />

                <DetailCard
                  icon={<FaGlobe />}
                  title="Pays"
                  value={listing.country}
                />

                <DetailCard
                  icon={<FaTruck />}
                  title="Incoterm"
                  value={listing.incoterm}
                />

                <DetailCard
                  icon={<FaCalendarAlt />}
                  title="Délai"
                  value={listing.deadline}
                />

                <DetailCard
                  icon={<FaCertificate />}
                  title="Certifications"
                  value={
                    listing.certifications?.join(", ") ||
                    "Aucune"
                  }
                />
              </div>

              {/* DOCUMENTS */}

              {listing.attachments?.length > 0 && (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "24px",
                    padding: "30px",
                    marginTop: "24px",
                    boxShadow:
                      "0 4px 20px rgba(0,0,0,0.05)",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "22px",
                      marginBottom: "20px",
                      color: "#14161C",
                    }}
                  >
                    📎 Documents associés (
                    {listing.attachments.length})
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {listing.attachments.map(
                      (file, index) => {
                        const url = getAttachmentUrl(file);
                        const isImage = isImageAttachment(file);

                        return (
                        <a
                          key={index}
                          href={url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!url) {
                              e.preventDefault();
                              window.alert(
                                `Aperçu indisponible pour "${file.name}" : ce document de démonstration n'a pas de fichier réel associé (aucun backend de stockage connecté pour l'instant).`
                              );
                            }
                          }}
                          title={
                            url
                              ? `Ouvrir ${file.name}`
                              : `Aperçu indisponible pour ${file.name}`
                          }
                          style={{
                            display: "block",
                            textDecoration: "none",
                            color: "inherit",
                            border:
                              "1px solid #E4E2DC",
                            borderRadius:
                              "16px",
                            padding: "18px",
                            background:
                              "#F6F5F2",
                            cursor: "pointer",
                            transition: "box-shadow 0.15s, transform 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {/* TYPE */}

                          <div
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "6px 10px",
                              background:
                                "#FBF0DC",
                              borderRadius:
                                "999px",
                              color:
                                "#B8720A",
                              fontSize:
                                "13px",
                              fontWeight:
                                "600",
                              marginBottom:
                                "12px",
                            }}
                          >
                            {getDocumentTypeLabel(
                              file.type
                            )}
                          </div>

                          {/* LABEL */}

                          <div
                            style={{
                              fontSize:
                                "18px",
                              fontWeight:
                                "700",
                              color:
                                "#14161C",
                              marginBottom:
                                "8px",
                            }}
                          >
                            {file.label ||
                              file.name}
                          </div>

                          {/* APERÇU IMAGE (si applicable) */}

                          {isImage && url && (
                            <img
                              src={url}
                              alt={file.name}
                              style={{
                                width: "100%",
                                maxHeight: "160px",
                                objectFit: "cover",
                                borderRadius: "10px",
                                marginBottom: "10px",
                                display: "block",
                              }}
                            />
                          )}

                          {/* NOM FICHIER */}

                          <div
                            style={{
                              color:
                                url ? "#4f46e5" : "#6B6D76",
                              fontSize:
                                "14px",
                              wordBreak:
                                "break-word",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontWeight: url ? 600 : 400,
                            }}
                          >
                            📄 {file.name}
                            {url ? " ↗" : " (aperçu indisponible)"}
                          </div>
                        </a>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* CONTACT — masqué en intégralité si c'est ma propre annonce :
                  "Contacter le propriétaire" n'a pas de sens pour son propre
                  bien, et "Modifier" est déjà accessible depuis "Mes annonces". */}

              {!isMyListing && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "24px",
                  padding: "30px",
                  marginTop: "30px",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.05)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <h2
                  style={{
                    fontSize: "22px",
                    marginBottom: "20px",
                    color: "#14161C",
                  }}
                >
                  🤝 Contacter le propriétaire
                </h2>

                <p
                  style={{
                    color: "#6B6D76",
                    marginBottom: "25px",
                  }}
                >
                  Intéressé par cette annonce ?
                  Contactez le vendeur pour obtenir
                  plus d'informations.
                </p>

                {(isOwnerAccountLoading || ownerAccount) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "18px 20px",
                      borderRadius: "16px",
                      background: "#F6F5F2",
                      border: "1px solid #E4E2DC",
                      marginBottom: "25px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg,#B8720A,#9C5E08)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        flexShrink: 0,
                      }}
                    >
                      <FaBuilding />
                    </div>

                    {isOwnerAccountLoading ? (
                      <p style={{ margin: 0, color: "#6B6D76" }}>
                        Chargement des informations du compte...
                      </p>
                    ) : (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "16px",
                              color: "#14161C",
                            }}
                          >
                            {ownerAccount.companyName}
                          </strong>

                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "3px 10px",
                              borderRadius: "999px",
                              background: "#FBF0DC",
                              color: "#B8720A",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <FaUserTie />
                            {formatRoleLabel(ownerAccount.role) ||
                              ownerAccount.role}
                          </span>

                          {ownerAccount.profileStatus === "validated" && (
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#16a34a",
                              }}
                            >
                              ✅ Profil validé
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "#6B6D76",
                            fontSize: "14px",
                          }}
                        >
                          🌍 {ownerAccount.country}
                          {ownerAccount.sector && (
                            <> · {ownerAccount.sector}</>
                          )}
                          {ownerAccount.certifications?.length > 0 && (
                            <> · {ownerAccount.certifications.join(", ")}</>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

<div
  style={{
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  }}
>
  <button
    onClick={handleContact}
    disabled={isContactingLoading}
    style={{
      padding: "14px 24px",
      border: "none",
      borderRadius: "12px",
      background: "#B8720A",
      color: "white",
      fontWeight: "600",
      cursor: isContactingLoading
        ? "not-allowed"
        : "pointer",
      opacity:
        isContactingLoading
          ? 0.7
          : 1,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    {isContactingLoading
      ? "⏳ Connexion..."
      : "📩 Contacter le vendeur"}
  </button>

  <button
    onClick={handleToggleFavorite}
    disabled={isFavoriteLoading}
    style={{
      padding: "14px 24px",
      border: `1px solid ${
        isFavorite
          ? "#C22D2D"
          : "#E4E2DC"
      }`,
      borderRadius: "12px",
      background: isFavorite
        ? "#fef2f2"
        : "#ffffff",
      color: isFavorite
        ? "#C22D2D"
        : "#14161C",
      fontWeight: "600",
      cursor:
        isFavoriteLoading
          ? "not-allowed"
          : "pointer",
      opacity:
        isFavoriteLoading
          ? 0.7
          : 1,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    {isFavorite ? (
      <FaHeart />
    ) : (
      <FaRegHeart />
    )}

    {isFavorite
      ? "Retirer des favoris"
      : "Ajouter aux favoris"}
  </button>
</div>

                {favoriteError && (
                  <p
                    style={{
                      color: "#C22D2D",
                      marginTop: "12px",
                      fontSize: "14px",
                    }}
                  >
                    {favoriteError}
                  </p>
                )}
              </div>
              )}
            </>
          )}
        </AsyncState>
      </div>
    </div>
  );
}