/**
 * Design tokens — système de design partagé par tout le frontend.
 * Ce fichier centralise les valeurs de couleurs, typographie, espacement,
 * ombres et bordures utilisées dans les composants UI.
 *
 * Basé sur le design system existant du projet :
 *   - Background : #F6F5F2 (beige clair)
 *   - Text       : #14161C (presque noir)
 *   - Accent     : #B8720A (orange ambre)
 *   - Fonts      : Inter (body) + Sora (display)
 */

// ─── Couleurs ────────────────────────────────────────────────────────────────
export const colors = {
  // Fond général de la page
  background:     "#F6F5F2",
  // Surface des cartes / composants
  surface:        "#F6F5F2",
  // Surface légèrement élevée (cartes avec relief)
  surfaceRaised:  "#FFFFFF",

  // Texte principal
  textPrimary:    "#14161C",
  // Texte secondaire / atténué
  textMuted:      "#6B7280",

  // Couleur d'accent principale (orange ambre)
  primary:        "#B8720A",
  primaryHover:   "#9A5E08",
  // Fond doux de l'accent (pour badges, hover légers)
  primarySoft:    "#FEF3C7",

  // Noir profond (boutons dark, icônes)
  ink:            "#14161C",
  inkSoft:        "#374151",

  // Bordures
  border:         "#E5E7EB",

  // États sémantiques
  danger:         "#DC2626",
  dangerSoft:     "#FEE2E2",
  success:        "#16A34A",
  successSoft:    "#DCFCE7",
  warning:        "#D97706",
  warningSoft:    "#FEF3C7",
};

// ─── Typographie ─────────────────────────────────────────────────────────────
export const typography = {
  // Familles de polices
  display:        "'Sora', sans-serif",   // Titres, headings
  body:           "'Inter', sans-serif",  // Corps de texte
  mono:           "'JetBrains Mono', 'Courier New', monospace",

  // Tailles de police
  fontSizeXs:     12,
  fontSizeSm:     13,
  fontSizeBase:   14,
  fontSizeMd:     15,
  fontSizeLg:     18,
  fontSizeXl:     22,
  fontSize2xl:    28,
  fontSize3xl:    36,

  // Hauteurs de ligne
  lineHeightTight:  1.3,
  lineHeightBase:   1.6,
  lineHeightLoose:  1.75,
};

// ─── Espacement ──────────────────────────────────────────────────────────────
// Système 4px : toutes les valeurs sont des multiples de 4
export const spacing = {
  xs:   4,   //  4px
  sm:   8,   //  8px
  md:   16,  // 16px
  lg:   24,  // 24px
  xl:   32,  // 32px
  xxl:  48,  // 48px
  xxxl: 64,  // 64px
};

// ─── Bordures arrondies ──────────────────────────────────────────────────────
export const radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
};

// ─── Ombres ──────────────────────────────────────────────────────────────────
export const shadow = {
  // Ombre subtile pour les cartes au repos
  card:   "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  // Ombre plus prononcée au survol (hover-lift)
  raised: "0 4px 12px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06)",
  // Ombre pour les modals / overlays
  modal:  "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)",
};
