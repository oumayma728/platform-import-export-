// Répertoire des informations "publiques" de compte, consultables par les
// autres utilisateurs (ex: avant de contacter le propriétaire d'une annonce).
// Clé = userId (correspond à `ownerId` sur les annonces).
export const mockAccounts = {
  user_42: {
    id: "user_42",
    role: "importer", // "importer" | "exporter"
    companyName: "Green Import Co.",
    country: "France",
    sector: "Agroalimentaire",
    certifications: ["ISO 22000"],
    memberSince: "2023",
    profileStatus: "validated",
    description:
      "Importateur français spécialisé dans les produits agroalimentaires méditerranéens (huiles, conserves, épicerie fine). Nous travaillons avec des producteurs certifiés Bio et ISO 22000 pour approvisionner la grande distribution et les circuits spécialisés en France et en Belgique.",
  },
  user_88: {
    id: "user_88",
    role: "exporter",
    companyName: "Nile Cotton Trading",
    country: "Égypte",
    sector: "Textile",
    certifications: ["GOTS"],
    memberSince: "2021",
    profileStatus: "validated",
    description:
      "Exportateur égyptien de coton et de textiles techniques certifiés GOTS, basé à Alexandrie. Nous accompagnons nos clients européens depuis la filature jusqu'à la confection, avec un contrôle qualité à chaque étape de la chaîne logistique.",
  },
  user_solartech: {
    id: "user_solartech",
    role: "exporter",
    companyName: "SolarTech Guangzhou",
    country: "Chine",
    sector: "Énergie / Photovoltaïque",
    certifications: ["CE", "ISO 9001"],
    memberSince: "2019",
    profileStatus: "validated",
    description:
      "Fabricant chinois de panneaux solaires photovoltaïques certifiés CE, basé à Guangzhou. Capacité de production de 200 MW/an, avec une équipe R&D dédiée à l'amélioration continue du rendement énergétique. Livraison par transport maritime direct vers l'Europe.",
  },
  user_olivetrade: {
    id: "user_olivetrade",
    role: "exporter",
    companyName: "Olive Trade Iberia",
    country: "Espagne",
    sector: "Agroalimentaire",
    certifications: ["IFS Food"],
    memberSince: "2024",
    profileStatus: "pending",
    description:
      "Jeune négociant espagnol (Andalousie) spécialisé dans l'huile d'olive extra vierge et les dérivés de l'olive. Entreprise récente sur la plateforme, en cours de constitution d'un historique de transactions et de validation de son profil.",
  },
  user_epicerie: {
    id: "user_epicerie",
    role: "importer",
    companyName: "Épicerie Gourmande Belgique",
    country: "Belgique",
    sector: "Agroalimentaire",
    certifications: ["Bio"],
    memberSince: "2022",
    profileStatus: "validated",
    description:
      "Grossiste belge en épicerie fine, spécialisé dans l'approvisionnement de restaurants et d'épiceries indépendantes en huiles, condiments et produits méditerranéens certifiés Bio. Recherche des fournisseurs fiables pour des volumes récurrents.",
  },
};