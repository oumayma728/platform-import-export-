export const ROLE_LABEL = {
  importer: "Importateur",
  exporter: "Exportateur",
};

const ROLE_ALIASES = {
  importer: "importer",
  importateur: "importer",
  IMPORTATEUR: "importer",
  exporter: "exporter",
  exportateur: "exporter",
  EXPORTATEUR: "exporter",
};

// Accepte : string simple, string CSV ("EXPORTATEUR,IMPORTATEUR"),
// ou tableau. Retourne toujours des rôles frontend normalisés et uniques.
export function toRoleArray(role) {
  if (!role) return [];

  const raw = Array.isArray(role)
    ? role
    : String(role).split(",");

  const normalized = raw
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ROLE_ALIASES[item] || ROLE_ALIASES[item.toLowerCase()] || item.toLowerCase());

  return [...new Set(normalized)];
}

export function hasRole(role, target) {
  return toRoleArray(role).includes(target);
}

export function isDualRole(role) {
  const roles = toRoleArray(role);
  return roles.includes("importer") && roles.includes("exporter");
}

export function formatRoleLabel(role) {
  const roles = toRoleArray(role);
  if (roles.length === 0) return "";
  return roles.map((r) => ROLE_LABEL[r] || r).join(" & ");
}
