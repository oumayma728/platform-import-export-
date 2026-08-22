// Données factices pour la messagerie. Une fois l'authentification réelle
// en place, ceci sera remplacé par de vrais appels API — la structure
// (conversations + messages + statut) est pensée pour rester identique.

export const mockConversations = [
  {
    id: "c1",
    listingId: "1",
    listingProduct: "Huile d'olive extra vierge",
    counterpart: { name: "Green Import Co.", country: "France" },
    status: "in_contact",
    updatedAt: "2026-07-08T09:30:00",
    messages: [
      {
        id: "m1",
        senderId: "user_17",
        text: "Bonjour, votre annonce sur l'huile d'olive nous intéresse. Quel est le volume disponible par mois ?",
        sentAt: "2026-07-07T14:12:00",
      },
      {
        id: "m2",
        senderId: "user_42",
        text: "Bonjour ! Nous pouvons fournir jusqu'à 5000L par mois, avec certification Bio et ISO 22000.",
        sentAt: "2026-07-07T15:03:00",
      },
      {
        id: "m3",
        senderId: "user_17",
        text: "Parfait. Pouvez-vous partager la fiche technique complète ?",
        sentAt: "2026-07-08T09:30:00",
        attachment: { name: "fiche-technique.pdf" },
      },
    ],
  },
  {
    id: "c2",
    listingId: "2",
    listingProduct: "Panneaux solaires monocristallins",
    counterpart: { name: "SunTech Industries", country: "Maroc" },
    status: "negotiating",
    updatedAt: "2026-07-06T11:00:00",
    messages: [
      {
        id: "m4",
        senderId: "user_42",
        text: "Bonjour, je suis intéressé par votre demande de panneaux solaires. Nous pouvons proposer un tarif dégressif à partir de 500 unités.",
        sentAt: "2026-07-05T10:00:00",
      },
      {
        id: "m5",
        senderId: "user_17",
        text: "Merci pour votre retour. Pouvez-vous nous faire une offre pour 2000 unités, incoterm CIF ?",
        sentAt: "2026-07-06T11:00:00",
      },
    ],
  },
  {
    id: "c3",
    listingId: "3",
    listingProduct: "Textile coton bio",
    counterpart: { name: "Nordic Textiles AB", country: "Suède" },
    status: "suggested",
    updatedAt: "2026-07-04T08:15:00",
    messages: [],
  },
  {
    id: "c4",
    listingId: "1",
    listingProduct: "Huile d'olive extra vierge",
    counterpart: { name: "Al Bahia Trading", country: "Émirats Arabes Unis" },
    status: "concluded",
    updatedAt: "2026-06-28T16:45:00",
    messages: [
      {
        id: "m6",
        senderId: "user_88",
        text: "Contrat signé de notre côté, merci pour cette collaboration !",
        sentAt: "2026-06-28T16:45:00",
      },
    ],
  },
];
