import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Identifiants invalides ou compte non administrateur.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = (hasError) => ({
    width: "100%",
    height: "44px",
    padding: "0 14px",
    borderRadius: "8px",
    border: `1.5px solid ${hasError ? "#dc2626" : "#e5e7eb"}`,
    background: "#fff",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#14161C",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F5F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Header card */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {/* Logo */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#14161C",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#14161C",
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
            }}
          >
            Espace administrateur
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Connectez-vous avec votre compte admin
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            border: "1px solid #ebebea",
            padding: "32px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Adresse e-mail
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={inputStyle(!!error)}
                onFocus={(e) => (e.target.style.borderColor = "#14161C")}
                onBlur={(e) => (e.target.style.borderColor = error ? "#dc2626" : "#e5e7eb")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle(!!error), paddingRight: "44px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#14161C")}
                  onBlur={(e) => (e.target.style.borderColor = error ? "#dc2626" : "#e5e7eb")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#991b1b",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: "1px" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              id="admin-login-submit"
              disabled={isLoading || !email || !password}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "8px",
                border: "none",
                background: isLoading || !email || !password ? "#d1d5db" : "#14161C",
                color: "#fff",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                cursor: isLoading || !email || !password ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading && email && password) {
                  e.currentTarget.style.background = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && email && password) {
                  e.currentTarget.style.background = "#14161C";
                }
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Footer sécurité */}
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#9ca3af",
            marginTop: "20px",
          }}
        >
          🔒 Accès réservé aux administrateurs autorisés
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700&display=swap');
      `}</style>
    </div>
  );
}
