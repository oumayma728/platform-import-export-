export const mockUser = {
  id: "user_42",
  email: "test@exporter.com",
  password: "password123",
  role: "importer", // "exporter" | "importer"
  profile: {
    companyName: "Green Import Co.",
    country: "France",
    sector: "Agroalimentaire",
    certifications: ["ISO 22000"],
    logoUrl: null,
  },
  profileStatus: "pending", // "pending" | "validated" | "rejected"
};
