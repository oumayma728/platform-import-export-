import { Link } from "react-router-dom";

export default function ListingsShowcasePage() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* HERO */}

      {/* <div
        style={{
          background:
            "linear-gradient(135deg,#14161C,#312e81)",
          borderRadius: "32px",
          padding: "60px",
          color: "white",
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            fontSize: "70px",
            marginBottom: "24px",
          }}
        >
          📦 🌍 📦
        </div>

        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            marginBottom: "20px",
          }}
        >
          Opportunités commerciales mondiales
        </h1>

        <p
          style={{
            maxWidth: "750px",
            margin: "0 auto",
            fontSize: "22px",
            color: "#c7d2fe",
            lineHeight: 1.8,
          }}
        >
          Publiez vos offres ou vos demandes et
          découvrez des partenaires stratégiques
          partout dans le monde.
        </p>
      </div> */}
      {/* APERÇU CATALOGUE */}

      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "24px",
          padding: "40px",
          overflow: "hidden",
          border: "1px solid #E4E2DC",
          marginBottom: "40px",
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
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            <div
              style={{
                fontSize: "60px",
                marginBottom: "14px",
              }}
            >
              🔒
            </div>

            <h2
              style={{
                fontSize: "36px",
                marginBottom: "16px",
              }}
            >
              Découvrez des milliers d'opportunités
            </h2>

            <p
              style={{
                color: "#6B6D76",
                lineHeight: 1.8,
                marginBottom: "24px",
              }}
            >
              Explorez les annonces publiées par des
              entreprises du monde entier et trouvez
              les meilleures opportunités pour votre
              activité.
            </p>

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
              marginLeft: "20px",
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