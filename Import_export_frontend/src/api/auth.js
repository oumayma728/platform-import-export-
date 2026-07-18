import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";
import { mockUser } from "../mocks/auth.mock";

export async function registerUser(payload) {
  if (USE_MOCKS) {
    await delay(400);
    const user = { ...mockUser, email: payload.email, role: payload.role, profileStatus: "pending" };
    return { user, token: `mock-token-${Date.now()}` };
  }
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  if (USE_MOCKS) {
    await delay(400);
    return { user: mockUser, token: `mock-token-${Date.now()}` };
  }
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
}

export async function getCurrentUser() {
  if (USE_MOCKS) {
    await delay(200);
    return mockUser;
  }
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export async function uploadCompanyLogo(file) {
  if (USE_MOCKS) {
    await delay(400);
    try {
      return { logoUrl: URL.createObjectURL(file) };
    } catch {
      throw new Error("Impossible de lire le fichier.");
    }
  }

  const formData = new FormData();
  formData.append("logo", file);

  try {
    const { data } = await apiClient.post("/auth/profile/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Impossible d'envoyer le logo pour le moment. Réessayez plus tard."
    );
  }
}

export async function completeProfile(payload) {
  if (USE_MOCKS) {
    await delay(400);
    return { ...mockUser, profile: payload, profileStatus: "pending" };
  }
  const { data } = await apiClient.put("/auth/profile", payload);
  return data;
}

/**
 * Demande de réinitialisation de mot de passe. Ne révèle jamais si
 * l'adresse existe réellement en base (message identique dans les deux
 * cas côté UI) — c'est une pratique de sécurité standard pour éviter
 * qu'un tiers ne puisse énumérer les comptes existants.
 */
export async function requestPasswordReset(email) {
  if (USE_MOCKS) {
    await delay(500);
    return { success: true };
  }

  try {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Impossible d'envoyer l'email pour le moment. Réessayez plus tard."
    );
  }
}
