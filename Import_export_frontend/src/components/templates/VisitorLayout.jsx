import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { colors, spacing, typography } from "../../styles/tokens";

const NAV_ITEMS = [
  { to: "/listings", label: "Annonces" },
  { to: "/Vmessages", label: "Messagerie" },
  { to: "/contact", label: "Contact" },
];

export default function VisitorLayout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: colors.background,
          borderBottom: `1px solid ${colors.border}`,
          padding: `${spacing.md}px ${spacing.lg}px`,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: spacing.lg,
          }}
        >
          {/* Logo */}
          <NavLink
            to="/"
            style={{ display: "flex", alignItems: "center", gap: spacing.sm, textDecoration: "none" }}
          >
            <span
              style={{
                fontSize: typography.fontSizeLg,
                fontWeight: 800,
                color: colors.textPrimary,
                fontFamily: typography.display,
              }}
            >
              Indeed²
            </span>
          </NavLink>

          {/* Navigation desktop (masquée sur mobile via CSS, voir index.css) */}
          <nav className="desktop-nav" style={{ display: "flex", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" }}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  textDecoration: "none",
                  color: isActive ? colors.primary : colors.textMuted,
                  fontSize: typography.fontSizeSm,
                  fontWeight: isActive ? 700 : 500,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: "6px",
                  backgroundColor: isActive ? colors.primarySoft : "transparent",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth Buttons (desktop uniquement, repris dans le menu mobile) */}
          <div className="desktop-nav" style={{ gap: spacing.sm, alignItems: "center", flexShrink: 0 }}>
            <NavLink
              to="/auth/login"
              style={({ isActive }) => ({
                textDecoration: "none",
                color: isActive ? colors.primary : colors.textPrimary,
                fontSize: typography.fontSizeSm,
                fontWeight: 600,
                padding: `${spacing.sm}px ${spacing.md}px`,
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                backgroundColor: "transparent",
                transition: "all 0.2s",
                cursor: "pointer",
                whiteSpace: "nowrap",
              })}
            >
              Connexion
            </NavLink>

            <NavLink
              to="/auth/register"
              style={{
                textDecoration: "none",
                color: colors.background,
                fontSize: typography.fontSizeSm,
                fontWeight: 700,
                padding: `${spacing.sm}px ${spacing.md}px`,
                backgroundColor: colors.primary,
                border: `1px solid ${colors.primary}`,
                borderRadius: "6px",
                transition: "all 0.2s",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Inscription
            </NavLink>
          </div>

          {/* Bouton burger (mobile uniquement via CSS) */}
          <button
            className="mobile-burger-button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            style={{
              border: `1px solid ${colors.border}`,
              background: "#fff",
              borderRadius: "8px",
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: colors.textPrimary,
              flexShrink: 0,
            }}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Panneau de navigation mobile (déplié par le bouton burger) */}
        {isMenuOpen && (
          <nav
            className="mobile-nav-panel"
            style={{
              maxWidth: "1400px",
              margin: `${spacing.md}px auto 0`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              paddingTop: spacing.md,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  textDecoration: "none",
                  color: isActive ? colors.primary : colors.textMuted,
                  fontSize: typography.fontSizeBase,
                  fontWeight: isActive ? 700 : 500,
                  padding: `${spacing.md}px`,
                  borderRadius: "8px",
                  backgroundColor: isActive ? colors.primarySoft : "transparent",
                })}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/auth/login"
              style={{
                textDecoration: "none",
                color: colors.textPrimary,
                fontSize: typography.fontSizeBase,
                fontWeight: 600,
                padding: `${spacing.md}px`,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                marginTop: spacing.sm,
              }}
            >
              Connexion
            </NavLink>
            <NavLink
              to="/auth/register"
              style={{
                textDecoration: "none",
                color: colors.background,
                fontSize: typography.fontSizeBase,
                fontWeight: 700,
                padding: `${spacing.md}px`,
                backgroundColor: colors.primary,
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              Inscription
            </NavLink>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          overflow: "auto",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: `${spacing.xl}px ${spacing.lg}px` }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
