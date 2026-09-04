import apiClient, { USE_MOCKS } from "./client";
import { delay } from "../utils/delay";
import { mockUser } from "../mocks/auth.mock";


/* =========================================================
   INSCRIPTION
========================================================= */

export async function registerUser(payload) {
  if (USE_MOCKS) {
    await delay(400);

    const user = {
      ...mockUser,
      email: payload.email,
      role: payload.role,
      profileStatus: "pending",
    };

    return {
      user,
      token: `mock-token-${Date.now()}`,
    };
  }

  try {
    const { data } = await apiClient.post(
      "/auth/register",
      payload
    );

    return data;
  } catch (err) {
    const detail = err.response?.data?.detail;
    const validation = err.response?.data?.erreurs;

    const message =
      Array.isArray(validation) && validation.length
        ? validation
            .map(
              (item) =>
                `${item.champ}: ${item.message}`
            )
            .join(" • ")
        : detail ||
          err.response?.data?.message ||
          "Impossible de créer le compte.";

    throw new Error(message);
  }
}


/* =========================================================
   CONNEXION
========================================================= */

export async function loginUser(payload) {
  if (USE_MOCKS) {
    await delay(400);

    return {
      user: mockUser,
      token: `mock-token-${Date.now()}`,
    };
  }

  try {
    const { data } = await apiClient.post(
      "/auth/login",
      payload
    );

    return data;
  } catch (err) {
    const detail = err.response?.data?.detail;
    const validation = err.response?.data?.erreurs;

    const message =
      Array.isArray(validation) && validation.length
        ? validation
            .map(
              (item) =>
                `${item.champ}: ${item.message}`
            )
            .join(" • ")
        : detail ||
          err.response?.data?.message ||
          "Identifiants invalides";

    throw new Error(message);
  }
}


/* =========================================================
   UTILISATEUR CONNECTÉ
========================================================= */

export async function getCurrentUser() {
  if (USE_MOCKS) {
    await delay(200);
    return mockUser;
  }

  const { data } = await apiClient.get(
    "/auth/me"
  );

  return data;
}


/* =========================================================
   LOGO ENTREPRISE
========================================================= */

export async function uploadCompanyLogo(file) {
  if (USE_MOCKS) {
    await delay(400);

    try {
      return {
        logoUrl: URL.createObjectURL(file),
      };
    } catch {
      throw new Error(
        "Impossible de lire le fichier."
      );
    }
  }

  const formData = new FormData();

  formData.append(
    "logo",
    file
  );

  try {
    const { data } = await apiClient.post(
      "/auth/profile/logo",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.detail ||
        err.response?.data?.message ||
        "Impossible d'envoyer le logo pour le moment."
    );
  }
}


/* =========================================================
   COMPLÉTER / MODIFIER PROFIL
========================================================= */

export async function completeProfile(payload) {
  if (USE_MOCKS) {
    await delay(400);

    return {
      ...mockUser,
      profile: payload,
      profileStatus: "pending",
    };
  }

  const { data } = await apiClient.put(
    "/auth/profile",
    payload
  );

  return data;
}


/* =========================================================
   MOT DE PASSE OUBLIÉ
========================================================= */

/**
 * Demande l'envoi d'un email de réinitialisation.
 *
 * Le backend renvoie volontairement le même message,
 * que l'adresse existe ou non.
 */
export async function requestPasswordReset(
  email
) {
  if (USE_MOCKS) {
    await delay(500);

    return {
      success: true,
      message:
        "Si ce compte existe, un email de réinitialisation a été envoyé.",
    };
  }

  try {
    const { data } = await apiClient.post(
      "/auth/forgot-password",
      {
        email,
      }
    );

    return data;
  } catch (err) {
    const detail =
      err.response?.data?.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : "Impossible d'envoyer l'email pour le moment. Réessayez plus tard."
    );
  }
}


/* =========================================================
   RÉINITIALISATION DU MOT DE PASSE
========================================================= */

/**
 * Utilisé depuis ResetPasswordPage.jsx
 * après clic sur le lien reçu par email.
 */
export async function resetPassword(
  token,
  newPassword,
  confirmPassword
) {
  if (USE_MOCKS) {
    await delay(500);

    return {
      success: true,
      message:
        "Mot de passe réinitialisé avec succès.",
    };
  }

  try {
    const { data } = await apiClient.post(
      "/auth/reset-password",
      {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }
    );

    return data;
  } catch (err) {
    const detail =
      err.response?.data?.detail;

    const validation =
      err.response?.data?.erreurs;

    const message =
      Array.isArray(validation) &&
      validation.length
        ? validation
            .map(
              (item) =>
                item.message
            )
            .join(" • ")
        : typeof detail === "string"
        ? detail
        : "Impossible de réinitialiser le mot de passe.";

    throw new Error(message);
  }
}


/* =========================================================
   CHANGEMENT DU MOT DE PASSE
   (utilisateur déjà connecté)
========================================================= */

export async function changePassword(
  payload
) {
  if (USE_MOCKS) {
    await delay(400);

    return {
      success: true,
      message:
        "Mot de passe modifié avec succès.",
    };
  }

  try {
    const { data } = await apiClient.post(
      "/auth/change-password",
      {
        current_password:
          payload.currentPassword,

        new_password:
          payload.newPassword,

        confirm_password:
          payload.confirmPassword,
      }
    );

    return data;
  } catch (err) {
    const detail =
      err.response?.data?.detail;

    const validation =
      err.response?.data?.erreurs;

    const message =
      Array.isArray(validation) &&
      validation.length
        ? validation
            .map(
              (item) =>
                item.message
            )
            .join(" • ")
        : typeof detail === "string"
        ? detail
        : "Impossible de modifier le mot de passe.";

    throw new Error(message);
  }
}