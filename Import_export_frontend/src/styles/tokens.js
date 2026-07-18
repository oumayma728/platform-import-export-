// Identité visuelle "enterprise moderne" inspirée du monde du commerce
// international : fond papier chaud, accent ocre (tampon douanier),
// sections sombres marine, typographie affirmée. Grilles aérées,
// rayons resserrés, ombres discrètes — sobriété assumée plutôt que
// décor SaaS générique.

export const colors = {
  background: "#FFFFFF",
  surface: "#F6F5F2",       // fond de page — papier chaud, pas gris-bleu
  surfaceRaised: "#FFFFFF", // cartes

  textPrimary: "#14161C",
  textMuted: "#6B6D76",

  primary: "#B8720A",       // ocre/or — CTA, liens, accents (tampon douanier)
  primaryHover: "#9C5E08",
  primarySoft: "#FBF0DC",

  ink: "#0E1526",           // marine profond — sections sombres, hero
  inkSoft: "#1B2740",

  border: "#E4E2DC",

  success: "#1D7A4C",
  successBg: "#E3F5E9",
  info: "#2A5FA5",
  infoBg: "#E7F0FA",
  danger: "#C22D2D",
  dangerBg: "#FBEAEA",
  neutral: "#5B5D66",
  neutralBg: "#F0EFEC",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 28,
  xl: 40,
  xxl: 72,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
};

export const typography = {
  display: "'Sora', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'IBM Plex Mono', monospace",

  fontSizeSm: 13,
  fontSizeBase: 15,
  fontSizeMd: 17,
  fontSizeLg: 22,
  fontSizeXl: 34,
  fontSizeXxl: 50,
};

export const shadow = {
  card: "0 1px 2px rgba(14, 21, 38, 0.04), 0 2px 10px rgba(14, 21, 38, 0.04)",
  raised: "0 6px 20px rgba(14, 21, 38, 0.10)",
  // Ombre "accentuée" pour les éléments mis en avant (offre recommandée,
  // carte sélectionnée...) — même teinte ocre que le reste de l'UI, pas de
  // bleu/violet générique de template SaaS.
  highlight: "0 16px 32px rgba(184, 114, 10, 0.16)",
};
