import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  // Alias pour éviter le conflit de nom avec `register` de react-hook-form
  const { register: registerAccount } = useAuth();

  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      // L'inscription connecte directement l'utilisateur (le backend
      // renvoie un token, comme au login) — pas besoin de se reconnecter.
      await registerAccount(data);
      navigate("/profile/complete");
    } catch (err) {
      setSubmitError(err.message);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 15px 50px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: "60px",
            marginBottom: "15px",
          }}
        >
          🌍
        </div>

        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#14161C",
          }}
        >
          Créer un compte
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
          }}
        >
          Rejoignez la plateforme <b>Indeed&sup2;</b>
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Email
            </label>

            <input
              type="email"
              {...register("email", {
                required: "Email requis",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Adresse email invalide",
                },
              })}
              placeholder="votre@email.com"
              style={{
                width: "100%",
                padding: "14px",
                border: `1px solid ${errors.email ? "#C22D2D" : "#ddd"}`,
                borderRadius: "12px",
                fontSize: "15px",
              }}
            />

            {errors.email && (
              <p
                style={{
                  color: "#C22D2D",
                  marginTop: "5px",
                  fontSize: "14px",
                }}
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Mot de passe
            </label>

            <input
              type="password"
              {...register("password", {
                required: "Mot de passe requis",
                minLength: {
                  value: 8,
                  message: "8 caractères minimum",
                },
              })}
              placeholder="********"
              style={{
                width: "100%",
                padding: "14px",
                border: `1px solid ${errors.password ? "#C22D2D" : "#ddd"}`,
                borderRadius: "12px",
                fontSize: "15px",
              }}
            />

            {errors.password && (
              <p
                style={{
                  color: "#C22D2D",
                  marginTop: "5px",
                  fontSize: "14px",
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Rôle */}
          <h3
            style={{
              marginBottom: "12px",
              color: "#14161C",
            }}
          >
            Je suis : <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 14 }}>(les deux sont possibles)</span>
          </h3>

          <div
            onClick={() => {
              const current = watch("role") || [];
              const next = current.includes("exporter")
                ? current.filter((r) => r !== "exporter")
                : [...current, "exporter"];
              setValue("role", next, { shouldValidate: true });
            }}
            style={{
              border:
                (watch("role") || []).includes("exporter")
                  ? "2px solid #B8720A"
                  : "1px solid #ddd",
              borderRadius: "16px",
              padding: "18px",
              cursor: "pointer",
              marginBottom: "12px",
              background:
                (watch("role") || []).includes("exporter")
                  ? "#FBF0DC"
                  : "#fff",
            }}
          >
            <h4>🚢 Exportateur</h4>

            <p
              style={{
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              Je vends et exporte des produits.
            </p>
          </div>

          <div
            onClick={() => {
              const current = watch("role") || [];
              const next = current.includes("importer")
                ? current.filter((r) => r !== "importer")
                : [...current, "importer"];
              setValue("role", next, { shouldValidate: true });
            }}
            style={{
              border:
                (watch("role") || []).includes("importer")
                  ? "2px solid #B8720A"
                  : "1px solid #ddd",
              borderRadius: "16px",
              padding: "18px",
              cursor: "pointer",
              marginBottom: "12px",
              background:
                (watch("role") || []).includes("importer")
                  ? "#FBF0DC"
                  : "#fff",
            }}
          >
            <h4>📦 Importateur</h4>

            <p
              style={{
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              Je recherche des fournisseurs.
            </p>
          </div>

          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: "-6px", marginBottom: "16px" }}>
            💡 Vous pouvez cocher les deux si votre entreprise importe certains produits et en exporte d'autres.
          </p>

          {/* Champ caché : c'est lui que react-hook-form valide, les
              cartes ci-dessus ne font que le remplir via setValue. */}
          <input
            type="hidden"
            {...register("role", {
              required: "Sélectionnez au moins un rôle pour continuer",
              validate: (value) =>
                (Array.isArray(value) && value.length > 0) ||
                "Sélectionnez au moins un rôle pour continuer",
            })}
          />

          {errors.role && (
            <p
              style={{
                color: "#C22D2D",
                marginTop: "-4px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {errors.role.message}
            </p>
          )}

          {submitError && (
            <div
              style={{
                marginBottom: "15px",
                color: "#C22D2D",
              }}
            >
              {submitError}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "14px",
              background: "#B8720A",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Créer mon compte
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
          }}
        >
          Déjà membre ?{" "}
          <Link
            to="/auth/login"
            style={{
              color: "#B8720A",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}