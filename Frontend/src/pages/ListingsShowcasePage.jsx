import { Link } from "react-router-dom";

export default function ListingsShowcasePage() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      

      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "24px",
          padding: "clamp(20px, 6vw, 40px)",
          overflow: "hidden",
          border: "1px solid #E4E2DC",
          marginBottom: "40px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            filter: "blur(4px)",
            opacity: 0.8,
          }}
        >
          <ListingPreview
            country="🇹🇳"
            product="Huile d'olive extra vierge"
            company="Olive Tunisia"
          />

          <ListingPreview
            country="🇫🇷"
            product="Textile coton bio"
            company="Green Textile France"
          />

          <ListingPreview
            country="🇨🇳"
            product="Panneaux solaires"
            company="Solar Energy China"
          />

          <ListingPreview
            country="🇩🇪"
            product="Machines industrielles"
            company="Industry GmbH"
          />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "600px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: "clamp(38px, 8vw, 60px)",
                marginBottom: "14px",
              }}
            >
              🔒
            </div>

            <h2
              style={{
                fontSize: "clamp(22px, 6vw, 36px)",
                lineHeight: 1.2,
                marginBottom: "16px",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              Découvrez des milliers d'opportunités
            </h2>

            <p
              style={{
                color: "#6B6D76",
                lineHeight: 1.8,
                marginBottom: "24px",
                overflowWrap: "break-word",
              }}
            >
              Explorez les annonces publiées par des
              entreprises du monde entier et trouvez
              les meilleures opportunités pour votre
              activité.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                justifyContent: "center",
              }}
            >
              <Link to="/listings/catalog">
                <button
                  style={{
                    border: "none",
                    borderRadius: "14px",
                    padding: "16px 26px",
                    background:
                      "linear-gradient(135deg,#B8720A,#9C5E08)",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  🚀 Voir les annonces
                </button>
              </Link>
              <Link to="/listings/create">
                <button
                  style={{
                    border: "none",
                    borderRadius: "14px",
                    padding: "16px 28px",
                    fontWeight: "700",
                    background:
                      "linear-gradient(135deg,#B8720A,#9C5E08)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  ➕ Publier une annonce
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "24px",
        border: "1px solid #E4E2DC",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "42px",
          marginBottom: "14px",
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <p
        style={{
          color: "#6B6D76",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function ListingPreview({
  country,
  product,
  company,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E4E2DC",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "12px",
      }}
    >
      <strong>
        {country} {product}
      </strong>

      <p
        style={{
          marginTop: "6px",
          color: "#6B6D76",
        }}
      >
        {company}
      </p>
    </div>
  );
}