import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { colors, spacing, typography } from "../../styles/tokens";
import { useAuth } from "../../context/AuthContext";
import { FaHeart } from "react-icons/fa";

const NAV_ITEMS = [
  { to: "/listings/catalog", label: "Annonces" },
  { to: "/listings/mine", label: "Mes annonces" },
//     {
// label: "Favoris",
// to: "/favorites",
// },
  { to: "/matching", label: "Matching IA" },
  { to: "/messages", label: "Messagerie" },
  { to: "/billing", label: "Facturation" },
  { to: "/profile", label: "Profil" },

];

// Routes qui doivent occuper toute la largeur/hauteur disponible,
// sans le padding/max-width applique par defaut au contenu (ex: messagerie).
const FULL_BLEED_PATHS = ["/messages"];

export default function UserHeaderLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const isFullBleed = FULL_BLEED_PATHS.some((path) => location.pathname.startsWith(path));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Referme le menu mobile automatiquement dès qu'on navigue vers une nouvelle page
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: isFullBleed ? "100vh" : "auto" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: colors.background,
          borderBottom: `1px solid ${colors.border}`,
          padding: `${spacing.md}px ${spacing.lg}px`,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          flexShrink: 0,
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
          {/* Bouton Deconnexion (desktop uniquement, repris dans le menu mobile) */}
          <button
            className="desktop-nav"
            onClick={handleLogout}
            style={{
              flexShrink: 0,
              color: "#ffffff",
              fontSize: typography.fontSizeSm,
              fontWeight: 700,
              padding: `${spacing.sm}px ${spacing.md}px`,
              backgroundColor: colors.danger,
              border: `1px solid ${colors.danger}`,
              borderRadius: "6px",
              transition: "all 0.2s",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Déconnexion
          </button>

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
            <button
              onClick={handleLogout}
              style={{
                marginTop: spacing.sm,
                textAlign: "left",
                color: colors.danger,
                fontSize: typography.fontSizeBase,
                fontWeight: 700,
                padding: `${spacing.md}px`,
                backgroundColor: "transparent",
                border: `1px solid ${colors.danger}`,
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Déconnexion
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      {isFullBleed ? (
        <main style={{ flex: 1, backgroundColor: colors.surface, overflow: "hidden", display: "flex" }}>
          <Outlet />
        </main>
      ) : (
        <main style={{ flex: 1, backgroundColor: colors.surface, overflow: "auto" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: `${spacing.xl}px ${spacing.lg}px` }}>
            <Outlet />
          </div>
        </main>
      )}
    </div>
  );
}
