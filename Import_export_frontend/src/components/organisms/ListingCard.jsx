import { Link } from "react-router-dom";
import Card from "../molecules/Card";
import StatusBadge from "../molecules/StatusBadge";
import { colors, typography } from "../../styles/tokens";

export default function ListingCard({ listing }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }}>
        <StatusBadge status={listing.type} />
      </div>

      <h3 style={{ fontFamily: typography.display, fontSize: typography.fontSizeMd, margin: "12px 0 6px", color: colors.textPrimary }}>
        {listing.product}
      </h3>

      <p style={{ fontSize: typography.fontSizeBase, color: colors.textPrimary, margin: "0 0 6px", fontWeight: 500 }}>
        {listing.quantity} · {listing.price} {listing.currency || "USD"}
      </p>

      {/* Prix converti si disponible */}
      {listing.prix_converti && listing.devise_affichage && listing.devise_affichage !== listing.currency && (
        <p style={{ fontSize: typography.fontSizeBase, color: colors.primary, margin: "0 0 10px", fontWeight: 500 }}>
          ≈ {listing.prix_converti} {listing.devise_affichage}
        </p>
      )}

      <p style={{ fontSize: typography.fontSizeBase, color: colors.textMuted, margin: "0 0 10px" }}>
        {listing.country} — {listing.category} — Incoterm {listing.incoterm}
      </p>

      {listing.certifications?.length > 0 && (
        <p style={{ fontSize: typography.fontSizeSm, color: colors.primary, margin: "0 0 12px" }}>
          {listing.certifications.join(" · ")}
        </p>
      )}

      <Link
        to={`/listings/${listing.id}`}
        style={{ color: colors.primary, fontWeight: 600, fontSize: typography.fontSizeBase, textDecoration: "none" }}
      >
        Voir le détail →
      </Link>
    </Card>
  );
}
