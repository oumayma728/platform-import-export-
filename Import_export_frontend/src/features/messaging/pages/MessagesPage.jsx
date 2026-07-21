import { Link } from "react-router-dom";

export default function MessagesPage() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* APERÇU */}

      <div
        style={{
          background: "#fff",
          borderRadius: "28px",
          padding: "50px",
          position: "relative",
          overflow: "hidden",
          border: "1px solid #E4E2DC",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            filter: "blur(3px)",
            opacity: 0.8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "30px",
            }}
          >
            <div>
              <h3>🇹🇳 Olive Tunisia</h3>
              <p>Exportateur</p>
            </div>

            <div
              style={{
                fontSize: "42px",
                alignSelf: "center",
              }}
            >
              🤝
            </div>

            <div>
              <h3>🇫🇷 Green Import France</h3>
              <p>Importateur</p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: "#F6F5F2",
                padding: "14px",
                borderRadius: "14px",
                maxWidth: "60%",
              }}
            >
              Bonjour, nous sommes intéressés par
              votre huile d'olive.
            </div>

            <div
              style={{
                background: "#B8720A",
                color: "#fff",
                padding: "14px",
                borderRadius: "14px",
                maxWidth: "60%",
                alignSelf: "flex-end",
              }}
            >
              Merci pour votre intérêt.
            </div>

            <div
              style={{
                background: "#F6F5F2",
                padding: "14px",
                borderRadius: "14px",
                maxWidth: "60%",
              }}
            >
              Pouvez-vous envoyer votre fiche
              technique ?
            </div>
          </div>
        </div>

        {/* OVERLAY */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "rgba(255,255,255,0.87)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "620px",
            }}
          >
            <div
              style={{
                fontSize: "60px",
                marginBottom: "16px",
              }}
            >
              🔓
            </div>

            <h2
              style={{
                fontSize: "36px",
                fontWeight: "800",
                marginBottom: "16px",
              }}
            >
              Entamez vos conversations internationales
            </h2>

            <p
              style={{
                color: "#6B6D76",
                lineHeight: 1.8,
                marginBottom: "30px",
              }}
            >
              Contactez directement les importateurs
              et exportateurs du monde entier,
              partagez vos documents et suivez vos
              négociations commerciales.
            </p>

            <Link to="/auth/login">
              <button
                style={{
                  border: "none",
                  borderRadius: "14px",
                  padding: "16px 26px",
                  fontWeight: "700",
                  background:
                    "linear-gradient(135deg,#B8720A,#9C5E08)",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow:
                    "0 15px 40px rgba(184,114,10,0.45)",
                }}
              >
                🚀 Débloquer la messagerie
              </button>
            </Link>
          </div>
        </div>
      </div>

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
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            fontSize: "64px",
          }}
        >
          🌍
        </div>

        <p
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            fontSize: "21px",
            color: "#c7d2fe",
            lineHeight: 1.8,
          }}
        >
          Échangez directement avec vos futurs
          partenaires internationaux et transformez
          vos opportunités commerciales en contrats.
        </p>
      </div> */}

      {/* AVANTAGES */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <FeatureCard
          icon="💬"
          title="Messagerie directe"
          description="Discutez instantanément avec vos partenaires."
        />

        <FeatureCard
          icon="📎"
          title="Partage de documents"
          description="Échangez contrats, certificats et fiches techniques."
        />

        <FeatureCard
          icon="🤝"
          title="Suivi des négociations"
          description="Gérez facilement chaque opportunité commerciale."
        />
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