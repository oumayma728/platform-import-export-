import { useId, useRef, useState, useEffect, useMemo } from "react";
import { Camera } from "lucide-react";
import { colors, typography } from "../../styles/tokens";

const ACCEPTED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_LOGO_SIZE_BYTES =
  5 * 1024 * 1024; // 5 Mo


function buildLogoUrl(logoUrl) {
  if (!logoUrl) return null;

  const value = String(logoUrl).trim();

  // URL déjà complète
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  // Base backend sans /api
  const backendBase =
    import.meta.env.VITE_BACKEND_URL ||
    "http://127.0.0.1:8000";

  const normalizedBase =
    backendBase.replace(/\/+$/, "");

  const normalizedPath =
    value.startsWith("/")
      ? value
      : `/${value}`;

  return `${normalizedBase}${normalizedPath}`;
}


export default function CompanyLogoUpload({
  logoUrl,
  companyName,
  onFileSelected,
  isUploading = false,
  size = 84,
}) {
  const inputRef = useRef(null);
  const inputId = useId();

  const [error, setError] =
    useState("");

  const [imgFailed, setImgFailed] =
    useState(false);


  const initial =
    (companyName || "?")
      .trim()
      .charAt(0)
      .toUpperCase();


  const resolvedLogoUrl =
    useMemo(
      () => buildLogoUrl(logoUrl),
      [logoUrl]
    );


  function handleFile(file) {
    setError("");
    setImgFailed(false);

    if (
      !ACCEPTED_LOGO_TYPES.includes(
        file.type
      )
    ) {
      setError(
        "Formats acceptés : JPG, PNG ou WEBP"
      );
      return;
    }

    if (
      file.size >
      MAX_LOGO_SIZE_BYTES
    ) {
      setError(
        "Image trop volumineuse (5 Mo maximum)"
      );
      return;
    }

    onFileSelected(file);
  }


  useEffect(() => {
    setImgFailed(false);
    setError("");
  }, [logoUrl]);


  const showImage =
    Boolean(resolvedLogoUrl) &&
    !imgFailed;


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <label
        htmlFor={
          isUploading
            ? undefined
            : inputId
        }
        className="hover-lift"
        aria-label="Changer le logo de l'entreprise"
        style={{
          position: "relative",

          width: size,
          height: size,

          borderRadius: "50%",

          margin:
            "0 auto 16px",

          cursor:
            isUploading
              ? "default"
              : "pointer",

          overflow:
            "hidden",

          background:
            showImage
              ? colors.surface
              : `linear-gradient(
                  135deg,
                  ${colors.primary},
                  ${colors.primaryHover}
                )`,

          border:
            `1px solid ${colors.border}`,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          WebkitTapHighlightColor:
            "transparent",
        }}
      >
        {showImage ? (
          <img
            src={
              resolvedLogoUrl
            }

            alt={
              `Logo ${
                companyName ||
                "entreprise"
              }`
            }

            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}

            onLoad={() => {
              setImgFailed(false);
              setError("");
            }}

            onError={(event) => {
              console.error(
                "Impossible de charger le logo :",
                event.currentTarget.src
              );

              setImgFailed(true);

              setError(
                "Le logo enregistré n'a pas pu être chargé."
              );
            }}
          />
        ) : (
          <span
            style={{
              color:
                "#fff",

              fontFamily:
                typography.display,

              fontSize:
                size * 0.38,

              fontWeight:
                700,
            }}
          >
            {initial}
          </span>
        )}


        {/* Overlay caméra */}
        <div
          style={{
            position:
              "absolute",

            inset:
              0,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              "rgba(14, 21, 38, 0.55)",

            color:
              "#fff",

            opacity:
              isUploading
                ? 1
                : 0,

            transition:
              "opacity 0.15s ease",

            pointerEvents:
              "none",
          }}
          className="logo-upload-overlay"
        >
          <Camera size={20} />
        </div>
      </label>


      <label
        htmlFor={
          isUploading
            ? undefined
            : inputId
        }

        style={{
          border:
            "none",

          background:
            "none",

          color:
            colors.primary,

          fontFamily:
            typography.body,

          fontSize:
            13,

          fontWeight:
            600,

          cursor:
            isUploading
              ? "default"
              : "pointer",

          padding:
            0,

          marginBottom:
            4,

          display:
            "inline-block",
        }}
      >
        {isUploading
          ? "Envoi en cours..."
          : logoUrl
          ? "Changer le logo"
          : "Ajouter un logo"}
      </label>


      {error && (
        <p
          style={{
            color:
              colors.danger,

            fontFamily:
              typography.body,

            fontSize:
              12,

            margin:
              0,

            textAlign:
              "center",
          }}
        >
          ⚠️ {error}
        </p>
      )}


      <input
        id={inputId}

        ref={inputRef}

        type="file"

        accept={
          ACCEPTED_LOGO_TYPES.join(
            ","
          )
        }

        style={{
          position:
            "absolute",

          width:
            1,

          height:
            1,

          padding:
            0,

          margin:
            -1,

          overflow:
            "hidden",

          clip:
            "rect(0,0,0,0)",

          whiteSpace:
            "nowrap",

          border:
            0,
        }}

        onChange={(event) => {
          const file =
            event.target
              .files?.[0];

          if (file) {
            handleFile(file);
          }

          event.target.value =
            "";
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