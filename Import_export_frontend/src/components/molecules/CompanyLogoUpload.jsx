import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { colors, typography } from "../../styles/tokens";

const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Avatar circulaire de l'entreprise, cliquable pour changer le logo.
 * Affiche l'image si `logoUrl` est défini, sinon les initiales du nom
 * de l'entreprise en fallback. Ce même composant sert d'avatar dans la
 * messagerie (voir MessagingPage) une fois le logo enregistré sur le
 * profil, pour garder une identité visuelle cohérente dans toute l'app.
 */
export default function CompanyLogoUpload({
  logoUrl,
  companyName,
  onFileSelected,
  isUploading = false,
  size = 84,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const initial = (companyName || "?").trim().charAt(0).toUpperCase();

  function handleFile(file) {
    setError("");

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setError("Formats acceptés : JPG, PNG ou WEBP");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setError("Image trop volumineuse (5 Mo maximum)");
      return;
    }
    onFileSelected(file);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        className="hover-lift"
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        aria-label="Changer le logo de l'entreprise"
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          margin: "0 auto 16px",
          cursor: isUploading ? "default" : "pointer",
          overflow: "hidden",
          background: logoUrl
            ? colors.surface
            : `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`Logo ${companyName || "entreprise"}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              color: "#fff",
              fontFamily: typography.display,
              fontSize: size * 0.38,
              fontWeight: 700,
            }}
          >
            {initial}
          </span>
        )}

        {/* Overlay au survol pour indiquer l'action */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(14, 21, 38, 0.55)",
            color: "#fff",
            opacity: isUploading ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
          className="logo-upload-overlay"
        >
          <Camera size={20} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => !isUploading && inputRef.current?.click()}
        disabled={isUploading}
        style={{
          border: "none",
          background: "none",
          color: colors.primary,
          fontFamily: typography.body,
          fontSize: 13,
          fontWeight: 600,
          cursor: isUploading ? "default" : "pointer",
          padding: 0,
          marginBottom: 4,
        }}
      >
        {isUploading ? "Envoi en cours..." : logoUrl ? "Changer le logo" : "Ajouter un logo"}
      </button>

      {error && (
        <p style={{ color: colors.danger, fontFamily: typography.body, fontSize: 12, margin: 0 }}>
          ⚠️ {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(",")}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <style>{`
        .hover-lift:hover .logo-upload-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
