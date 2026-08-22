export const mockListings = [
  {
    id: "1",
    type: "offer",
    product: "Huile d'olive extra vierge",

    quantity: 5000,
    quantityUnit: "L",

    price: 3.2,
    currency: "USD",

    country: "Tunisie",
    category: "Agroalimentaire",

    incoterm: "FOB",

    deadline: "2026-09-15",

    certifications: [
      "Bio",
      "ISO 22000",
    ],

    ownerId: "user_42",

    status: "active",

    attachments: [
      {
        name: "certificat-bio.pdf",

        label:
          "Certification Bio UE 2026",

        type: "certificate",
      },

      {
        name: "fiche-technique.pdf",

        label:
          "Fiche technique Huile d'olive extra vierge",

        type: "technical_sheet",
      },

      {
        name: "photo-produit.jpg",

        label:
          "Photo bouteille huile d'olive",

        type: "photo",
      },
    ],
  },

  {
    id: "2",

    type: "demand",

    product:
      "Panneaux solaires monocristallins",

    quantity: 2000,
    quantityUnit: "piece",

    price: 150000,
    currency: "USD",

    country: "Maroc",

    category: "Machines industrielles",

    incoterm: "CIF",

    deadline: "2026-08-01",

    certifications: ["CE"],

    ownerId: "user_42",

    status: "active",

    attachments: [
      {
        name: "cahier-des-charges.pdf",

        label:
          "Cahier des charges du projet",

        type: "technical_sheet",
      },
    ],
  },

  {
    id: "3",

    type: "offer",

    product:
      "Textile coton bio",

    quantity: 10,
    quantityUnit: "tonne",

    price: 4.8,
    currency: "USD",

    country: "Égypte",

    category: "Textile",

    incoterm: "EXW",

    deadline: "2026-10-01",

    certifications: ["GOTS"],

    ownerId: "user_88",

    status: "active",

    attachments: [
      
    ],
  },
  {
    id: "4",
    type: "offer",
    product: "Panneaux solaires monocristallins",
    quantity: 2200,
    quantityUnit: "piece",
    price: 148000,
    currency: "USD",
    country: "Chine",
    category: "Industrie",
    incoterm: "CIF",
    deadline: "2026-08-20",
    certifications: ["CE", "ISO 9001"],
    ownerId: "user_solartech",
    status: "active",
    attachments: [],
  },
  {
    id: "5",
    type: "offer",
    product: "Huile d'olive extra vierge (variété Picual)",
    quantity: 3000,
    quantityUnit: "L",
    price: 3.6,
    currency: "USD",
    country: "Espagne",
    category: "Agroalimentaire",
    incoterm: "FOB",
    deadline: "2026-09-30",
    certifications: ["IFS Food"],
    ownerId: "user_olivetrade",
    status: "active",
    attachments: [],
  },
  {
    id: "6",
    type: "demand",
    product: "Huile d'olive extra vierge",
    quantity: 4000,
    quantityUnit: "L",
    price: 3.5,
    currency: "EUR",
    country: "Belgique",
    category: "Agroalimentaire",
    incoterm: "DAP",
    deadline: "2026-09-01",
    certifications: ["Bio"],
    ownerId: "user_epicerie",
    status: "active",
    attachments: [],
  },
];

export const mockMatches = [
  {
    id: "m1",

    listingId: "1",

    matchScore: 87,

    reasons: {
      product:
        "Correspondance exacte de catégorie",

      price:
        "Dans la fourchette budgétaire",

      location:
        "Proximité logistique favorable",

      reliability:
        "Fournisseur certifié depuis 3 ans",

      deadline:
        "Délai compatible",
    },

    counterpart: {
      name: "Épicerie Gourmande Belgique",
      country: "Belgique",
      ownerId: "user_epicerie",
    },

    // Annonce réelle du partenaire (sa demande d'huile d'olive), distincte
    // de votre propre annonce référencée par `listingId` ci-dessus.
    counterpartListingId: "6",
  },

  {
    id: "m2",

    listingId: "2",

    matchScore: 78,

    reasons: {
      product:
        "Spécifications techniques alignées avec le cahier des charges",

      price:
        "Offre légèrement au-dessus du budget cible (+4%)",

      location:
        "Transport maritime direct disponible",

      reliability:
        "Fabricant certifié CE, historique de 5 ans",

      deadline:
        "Délai de production compatible avec l'échéance",
    },

    counterpart: {
      name: "SolarTech Guangzhou",
      country: "Chine",
      ownerId: "user_solartech",
    },
    counterpartListingId: "4",
  },

  {
    id: "m3",

    listingId: "1",

    matchScore: 65,

    reasons: {
      product:
        "Produit similaire, variété légèrement différente",

      price:
        "Budget compatible sous condition de volume",

      location:
        "Distance logistique plus importante",

      reliability:
        "Nouvelle entreprise, pas encore d'historique",

      deadline:
        "Délai à confirmer avec le fournisseur",
    },

    counterpart: {
      name: "Olive Trade Iberia",
      country: "Espagne",
      ownerId: "user_olivetrade",
    },
    counterpartListingId: "5",
  },
];