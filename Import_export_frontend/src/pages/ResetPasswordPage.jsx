import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { resetPassword } from "../api/auth";

export default function ResetPasswordPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const newPassword = watch("password", "");

  async function onSubmit(data) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(token, data.password);
      setIsDone(true);
    } catch (err) {
      setSubmitError(err.message || "Une erreur est survenue. Réessayez plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Shell>
        <h2 style={{ marginBottom: "12px" }}>Lien invalide</h2>
        <p style={{ color: "#6B6D76", lineHeight: 1.7 }}>
          Ce lien de réinitialisation est manquant ou invalide.
          Veuillez relancer la procédure « Mot de passe oublié ».
        </p>
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            style={{ border: "none", background: "transparent", color: "#B8720A", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
          >
            ← Relancer la demande
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "60px", marginBottom: "12px" }}>🔑</div>
        <h1 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "12px", color: "#14161C" }}>
          Nouveau mot de passe
        </h1>
        <p style={{ color: "#6B6D76", lineHeight: 1.7 }}>
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      {!isDone ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              placeholder="8 caractères minimum"
              {...register("password", {
                required: "Mot de passe requis",
                minLength: { value: 8, message: "8 caractères minimum" },
              })}
              style={{
                width: "100%",
                padding: "14px",
                border: `1px solid ${errors.password ? "#C22D2D" : "#E4E2DC"}`,
                borderRadius: "12px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
            {errors.password && (
              <p style={{ color: "#C22D2D", marginTop: "6px", fontSize: "14px" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              placeholder="Répétez le mot de passe"
              {...register("confirmPassword", {
                required: "Confirmation requise",
                validate: (value) => value === newPassword || "Les mots de passe ne correspondent pas",
              })}
              style={{
                width: "100%",
                padding: "14px",
                border: `1px solid ${errors.confirmPassword ? "#C22D2D" : "#E4E2DC"}`,
                borderRadius: "12px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
            {errors.confirmPassword && (
              <p style={{ color: "#C22D2D", marginTop: "6px", fontSize: "14px" }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {submitError && (
            <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", background: "#fef2f2", color: "#C22D2D", fontSize: "14px" }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "14px",
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "16px",
              cursor: isSubmitting ? "default" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Enregistrement..." : "🔒 Mettre à jour le mot de passe"}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "58px", marginBottom: "12px" }}>✅</div>
          <h2 style={{ marginBottom: "12px" }}>Mot de passe mis à jour</h2>
          <p style={{ color: "#6B6D76", lineHeight: 1.7 }}>
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez vous connecter.
          </p>
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "14px",
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Se connecter
          </button>
        </div>
      )}

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ border: "none", background: "transparent", color: "#B8720A", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
        >
          ← Retour
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#F6F5F2 0%,#FBF0DC 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          borderRadius: "28px",
          padding: "40px",
          boxShadow: "0 20px 50px rgba(15,23,42,.08)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
