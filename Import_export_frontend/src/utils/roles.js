export const ROLE_LABEL = {
  importer: "Importateur",
  exporter: "Exportateur",
};

// Normalise un rôle (string ou array) en tableau, pour un traitement uniforme.
export function toRoleArray(role) {
  if (!role) return [];
  return Array.isArray(role) ? role : [role];
}

export function hasRole(role, target) {
  return toRoleArray(role).includes(target);
}

export function isDualRole(role) {
  const roles = toRoleArray(role);
  return roles.includes("importer") && roles.includes("exporter");
}

// Libellé d'affichage : "Importateur", "Exportateur", ou
// "Importateur & Exportateur" si les deux sont déclarés.
export function formatRoleLabel(role) {
  const roles = toRoleArray(role);
  if (roles.length === 0) return "";
  return roles.map((r) => ROLE_LABEL[r] || r).join(" & ");
}