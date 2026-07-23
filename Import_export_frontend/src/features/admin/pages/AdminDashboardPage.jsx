import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate, NavLink } from "react-router-dom";
import { getDashboardStats } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const ADMIN_SECTIONS = [
  { to: "/admin/users", label: "Utilisateurs", icon: "👥", desc: "Gérer les comptes" },
  { to: "/admin/validation", label: "Validation", icon: "✅", desc: "Profils en attente" },
  { to: "/admin/enterprises", label: "Entreprises", icon: "🏢", desc: "Directory" },
  { to: "/admin/reports", label: "Signalements", icon: "🚩", desc: "Reports" },
  { to: "/admin/kyb", label: "KYB", icon: "🔍", desc: "Vérifications" },
  { to: "/admin/badges", label: "Badges", icon: "🏅", desc: "Trust badges" },
  { to: "/admin/reviews", label: "Avis", icon: "⭐", desc: "Reviews" },
  { to: "/admin/history", label: "Historique", icon: "📜", desc: "Modération" },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  if (isLoading) return <p style={{ color: colors.textMuted }}>Chargement...</p>;
  if (error) return <p style={{ color: colors.danger }}>{error}</p>;

  const cards = stats
    ? [
        { label: "Utilisateurs totaux", value: stats.totalUsers, color: colors.primary },
        { label: "En attente de validation", value: stats.pendingValidation, color: "#D97706" },
        { label: "Profils validés", value: stats.validated, color: colors.success },
        { label: "Profils rejetés", value: stats.rejected, color: colors.danger },
        { label: "Comptes suspendus", value: stats.suspended, color: "#6B7280" },
        { label: "Entreprises", value: stats.totalEntreprises, color: colors.info },
        { label: "Annonces actives", value: stats.totalAnnonces, color: colors.primary },
        { label: "Signalements totaux", value: stats.totalReports, color: "#D97706" },
        { label: "Signalements en attente", value: stats.pendingReports, color: colors.danger },
      ]
    : [];

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Tableau de bord admin
      </h1>

      {/* Navigation cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: spacing.md, marginBottom: spacing.xl }}>
        {ADMIN_SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            style={{
              textDecoration: "none",
              background: colors.surfaceRaised,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: spacing.md,
              boxShadow: shadow.card,
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 24 }}>{section.icon}</span>
            <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeBase, fontWeight: 700, color: colors.textPrimary }}>{section.label}</p>
            <p style={{ margin: "2px 0 0", fontSize: typography.fontSizeSm, color: colors.textMuted }}>{section.desc}</p>
          </NavLink>
        ))}
      </div>

      {/* Stats cards */}
      <h2 style={{ fontFamily: typography.display, fontSize: typography.fontSizeLg, fontWeight: 700, marginBottom: spacing.md, color: colors.textPrimary }}>
        Statistiques
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: spacing.md }}>
        {cards.map((card) => (
          <div key={card.label} style={{
            background: colors.surfaceRaised,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: spacing.lg,
            boxShadow: shadow.card,
          }}>
            <p style={{ fontSize: typography.fontSizeSm, color: colors.textMuted, margin: 0 }}>{card.label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: card.color, margin: "8px 0 0", fontFamily: typography.display }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
