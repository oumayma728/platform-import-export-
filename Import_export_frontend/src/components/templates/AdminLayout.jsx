import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, Users, Building2, Flag, SearchCheck, Award, Star, History, UserCog, LogOut, ExternalLink } from "lucide-react";
import { colors, radius, spacing, typography } from "../../styles/tokens";
import { useAdmin } from "../../features/admin/context/AdminContext";

const ADMIN_NAV = [
  { to: "/admin", label: "Tableau de bord", Icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Utilisateurs", Icon: Users },
  { to: "/admin/validation", label: "Validation", Icon: ShieldCheck },
  { to: "/admin/enterprises", label: "Entreprises", Icon: Building2 },
  { to: "/admin/reports", label: "Signalements", Icon: Flag },
  { to: "/admin/kyb", label: "KYB", Icon: SearchCheck },
  { to: "/admin/badges", label: "Badges", Icon: Award },
  { to: "/admin/reviews", label: "Avis", Icon: Star },
  { to: "/admin/history", label: "Historique", Icon: History },
  { to: "/admin/accounts", label: "Comptes admin", Icon: UserCog, superadmin: true },
];

export default function AdminLayout() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          display: "flex",
          flexDirection: "column",
          padding: `${spacing.lg}px ${spacing.md}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, padding: `0 ${spacing.sm}px ${spacing.lg}px`, borderBottom: "1px solid #1e293b", marginBottom: spacing.lg }}>
          <ShieldCheck size={24} color={colors.primary} />
          <div>
            <div style={{ fontWeight: 800, fontSize: typography.fontSizeMd, color: "#f8fafc", fontFamily: typography.display }}>Indeed² Admin</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Modération & Confiance</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {ADMIN_NAV.filter((item) => !item.superadmin || admin?.role === "superadmin").map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: radius.sm,
                textDecoration: "none",
                fontSize: typography.fontSizeSm,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#ffffff" : "#94a3b8",
                backgroundColor: isActive ? colors.primary : "transparent",
                transition: "all 0.15s ease",
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: spacing.md, marginTop: spacing.lg }}>
          {admin && (
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: spacing.sm }}>
              <strong style={{ color: "#e2e8f0" }}>{admin.prenom} {admin.nom}</strong>
              <br />
              {admin.email} · {admin.role}
            </p>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: radius.sm, textDecoration: "none", fontSize: typography.fontSizeSm, fontWeight: 500, color: "#94a3b8" }}
          >
            <ExternalLink size={16} /> Voir le site
          </a>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: radius.sm,
              border: "none",
              background: "transparent",
              color: "#fca5a5",
              fontSize: typography.fontSizeSm,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: `${spacing.xl}px ${spacing.lg}px` }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
