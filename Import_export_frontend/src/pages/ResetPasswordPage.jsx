import { useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useForm } from "react-hook-form";

import {
  resetPassword,
} from "../api/auth";

export default function ResetPasswordPage() {
  const [searchParams] =
    useSearchParams();

  const navigate = useNavigate();

  const token =
    searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState(null);

  const [success, setSuccess] =
    useState(false);

  const newPassword =
    watch("newPassword");

  async function onSubmit(data) {
    if (!token) {
      setSubmitError(
        "Lien de réinitialisation invalide."
      );

      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await resetPassword(
        token,
        data.newPassword,
        data.confirmPassword
      );

      setSuccess(true);

    } catch (err) {
      setSubmitError(
        err?.response?.data?.detail ||
          err?.message ||
          "Impossible de réinitialiser le mot de passe."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg,#F6F5F2,#FBF0DC)",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 40,
            borderRadius: 24,
            textAlign: "center",
          }}
        >
          <h2>
            Lien invalide
          </h2>

          <p>
            Ce lien de réinitialisation
            n'est pas valide.
          </p>

          <button
            onClick={() =>
              navigate(
                "/forgot-password"
              )
            }
          >
            Demander un nouveau lien
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#F6F5F2 0%,#FBF0DC 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 28,
          padding: 40,
          boxShadow:
            "0 20px 50px rgba(15,23,42,.08)",
        }}
      >
        {!success ? (
          <>
            <div
              style={{
                textAlign: "center",
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  fontSize: 58,
                }}
              >
                🔑
              </div>

              <h1>
                Nouveau mot de passe
              </h1>

              <p
                style={{
                  color: "#6B6D76",
                }}
              >
                Choisissez un nouveau mot de passe
                sécurisé.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit(onSubmit)
              }
            >
              <div
                style={{
                  marginBottom: 18,
                }}
              >
                <label>
                  Nouveau mot de passe
                </label>

                <input
                  type="password"
                  {...register(
                    "newPassword",
                    {
                      required:
                        "Mot de passe requis",

                      minLength: {
                        value: 8,
                        message:
                          "8 caractères minimum",
                      },

                      pattern: {
                        value:
                          /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/,

                        message:
                          "Au moins une majuscule et un chiffre",
                      },
                    }
                  )}
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",

                    padding: 14,
                    marginTop: 8,

                    border:
                      "1px solid #E4E2DC",

                    borderRadius: 12,
                  }}
                />

                {errors.newPassword && (
                  <p
                    style={{
                      color:
                        "#C22D2D",

                      fontSize: 13,
                    }}
                  >
                    {
                      errors
                        .newPassword
                        .message
                    }
                  </p>
                )}
              </div>

              <div
                style={{
                  marginBottom: 18,
                }}
              >
                <label>
                  Confirmer le mot de passe
                </label>

                <input
                  type="password"
                  {...register(
                    "confirmPassword",
                    {
                      required:
                        "Confirmation requise",

                      validate: (
                        value
                      ) =>
                        value
                          ===
                          newPassword ||
                        "Les mots de passe ne correspondent pas",
                    }
                  )}
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",

                    padding: 14,
                    marginTop: 8,

                    border:
                      "1px solid #E4E2DC",

                    borderRadius: 12,
                  }}
                />

                {errors.confirmPassword && (
                  <p
                    style={{
                      color:
                        "#C22D2D",

                      fontSize: 13,
                    }}
                  >
                    {
                      errors
                        .confirmPassword
                        .message
                    }
                  </p>
                )}
              </div>

              {submitError && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: 12,
                    background:
                      "#fef2f2",

                    color:
                      "#C22D2D",

                    borderRadius: 10,
                  }}
                >
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                style={{
                  width: "100%",
                  padding: 15,
                  border: "none",
                  borderRadius: 12,

                  background:
                    "linear-gradient(135deg,#B8720A,#9C5E08)",

                  color: "#fff",
                  fontWeight: 700,

                  cursor:
                    isSubmitting
                      ? "default"
                      : "pointer",
                }}
              >
                {isSubmitting
                  ? "Réinitialisation..."
                  : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 58,
              }}
            >
              ✅
            </div>

            <h2>
              Mot de passe modifié
            </h2>

            <p
              style={{
                color:
                  "#6B6D76",
              }}
            >
              Votre mot de passe a été
              réinitialisé avec succès.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/auth/login"
                )
              }
              style={{
                marginTop: 20,
                padding:
                  "12px 20px",

                border: "none",
                borderRadius: 10,

                background:
                  "#B8720A",

                color: "#fff",
                fontWeight: 700,

                cursor:
                  "pointer",
              }}
            >
              Se connecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}