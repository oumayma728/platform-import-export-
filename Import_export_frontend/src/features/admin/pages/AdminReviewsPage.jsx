import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getReviews } from "../api/admin";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

function StarRating({ note }) {
  return (
    <span style={{ color: colors.primary, fontSize: 14, letterSpacing: 2 }}>
      {"★".repeat(note)}{"☆".repeat(5 - note)}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { admin } = useAdmin();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Avis utilisateurs
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Retours laissés par les utilisateurs sur les entreprises.
        </p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : reviews.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun avis pour le moment.</p>
      ) : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{reviews.length} avis</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                    <StarRating note={r.note} />
                    <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase, color: colors.textPrimary }}>
                      {r.note}/5
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>
                    {r.createdAt?.split("T")[0]}
                  </span>
                </div>
                {r.commentaire && (
                  <p style={{ margin: "4px 0", fontSize: typography.fontSizeSm, color: colors.textPrimary }}>{r.commentaire}</p>
                )}
                <div style={{ display: "flex", gap: spacing.md, marginTop: 4, fontSize: 12, color: colors.textMuted }}>
                  {r.auteur && (
                    <span>Par <strong>{r.auteur.prenom} {r.auteur.nom}</strong></span>
                  )}
                  {r.entreprise && (
                    <span>→ <strong>{r.entreprise.nom}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
