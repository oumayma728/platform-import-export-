import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaGlobe, FaDollarSign } from "react-icons/fa";

import { getFavoriteListings } from "../api/favorites";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    getFavoriteListings().then(setFavorites);
  }, []);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            fontWeight: "800",
            marginBottom: "10px",
            color: "#14161C",
          }}
        >
          📌 Opportunités sauvegardées
        </h1>

        <p
          style={{
            color: "#6B6D76",
            fontSize: "17px",
          }}
        >
          Retrouvez rapidement toutes les annonces
          qui vous intéressent.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "28px",
            padding: "80px 40px",
            textAlign: "center",
            border: "1px solid #E4E2DC",
          }}
        >
          <div
            style={{
              fontSize: "70px",
              marginBottom: "16px",
            }}
          >
            🤍
          </div>

          <h2
            style={{
              marginBottom: "10px",
            }}
          >
            Aucune annonce sauvegardée
          </h2>

          <p
            style={{
              color: "#6B6D76",
            }}
          >
            Ajoutez des annonces à vos favoris afin
            de les retrouver plus facilement.
          </p>

          <Link to="/listings/catalog">
            <button
              style={{
                marginTop: "24px",
                padding: "14px 24px",
                border: "none",
                borderRadius: "14px",
                background: "#B8720A",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Explorer les annonces
            </button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(340px,1fr))",
            gap: "24px",
          }}
        >
          {favorites.map((listing) => (
            <div
              key={listing.id}
              style={{
                background: "#fff",
                borderRadius: "24px",
                overflow: "hidden",
                border: "1px solid #E4E2DC",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,.06)",
                transition: ".2s",
              }}
            >
              {/* TOP */}

              <div
                style={{
                  background:
                    "linear-gradient(135deg,#B8720A,#9C5E08)",
                  color: "#fff",
                  padding: "18px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>
                  {listing.product}
                </strong>

                <FaHeart />
              </div>

              {/* CONTENT */}

              <div
                style={{
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    color: "#475569",
                  }}
                >
                  <FaGlobe />
                  {listing.country}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "24px",
                    color: "#475569",
                  }}
                >
                  <FaDollarSign />
                  {listing.price}{" "}
                  {listing.currency}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <Link
                    to={`/listings/${listing.id}`}
                    style={{
                      flex: 1,
                    }}
                  >
                    <button
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        borderRadius: "12px",
                        background: "#B8720A",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Voir l'annonce
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}