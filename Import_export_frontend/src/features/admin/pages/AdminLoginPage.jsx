import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { colors, radius, spacing, typography } from "../../../styles/tokens";

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};
  const [email, setEmail] = useState(prefill.email || "");
  const [password, setPassword] = useState(prefill.password || "");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true, state: null });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Connexion échouée.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#0F172A 0%,#1E293B 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#fff",
          borderRadius: 24,
          padding: 40,
          boxShadow: "0 15px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              borderRadius: radius.full,
              background: colors.primarySoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={32} color={colors.primary} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: colors.textPrimary,
              fontFamily: typography.display,
              letterSpacing: "-0.01em",
            }}
          >
            Espace Administrateur
          </h1>
          <p style={{ margin: "8px 0 0", color: colors.textMuted, fontSize: typography.fontSizeSm }}>
            Accès réservé à l'équipe de modération
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 14px",
              borderRadius: radius.md,
              background: colors.dangerBg,
              border: "1px solid #fecaca",
              color: colors.danger,
              fontSize: typography.fontSizeSm,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: typography.fontSizeSm }}>
              Email administrateur
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@platform.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                fontSize: typography.fontSizeBase,
                boxSizing: "border-box",
                outline: "none",
              }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: typography.fontSizeSm }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                fontSize: typography.fontSizeBase,
                boxSizing: "border-box",
                outline: "none",
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: radius.lg,
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "#fff",
              fontSize: typography.fontSizeBase,
              fontWeight: 600,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              marginTop: spacing.sm,
            }}
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link to="/" style={{ fontSize: typography.fontSizeSm, color: colors.primary, fontWeight: 600, textDecoration: "none" }}>
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
