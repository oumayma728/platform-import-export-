import { createResourceApi } from "../../../api/createResourceApi";
import apiClient, { USE_MOCKS } from "../../../api/client";
import { delay } from "../../../utils/delay";
import { mockConversations } from "../mocks/messages.mock";
// En mode mock uniquement, on reproduit le quota local. En mode réel, le
// backend est l'unique source de vérité et ne consomme un crédit qu'au
// premier message/document d'une conversation.
import { checkPaywallStatus, incrementUsage } from "../../billing/api/billing";

const CURRENT_USER_ID = "user_42";

const conversationsApi = createResourceApi("conversations", mockConversations);

// GET /conversations — historique des conversations de l'utilisateur
export const getConversations = conversationsApi.getAll;
// GET /conversations/:id — fil de discussion d'une conversation
export const getConversationById = conversationsApi.getById;

/**
 * POST /conversations/:id/messages — envoie un message dans une conversation.
 * Contrat attendu du backend réel : renvoie le message créé (même forme
 * que les objets `messages[]` déjà présents dans une conversation).
 */
export async function sendMessage(conversationId, text, attachment) {
  if (USE_MOCKS) {
    await delay(300);
    const conversation = mockConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error("Conversation introuvable");

    const { isBlocked } = await checkPaywallStatus();
    if (isBlocked) {
      throw new Error(
        "Limite de 50 messages gratuits atteinte. Passez à une offre pour continuer."
      );
    }

    const message = {
      id: `m-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      text,
      sentAt: new Date().toISOString(),
      ...(attachment ? { attachment } : {}),
    };

    conversation.messages.push(message);
    conversation.updatedAt = message.sentAt;
    await incrementUsage();
    return message;
  }

  try {
    // Avec une pièce jointe, on envoie UN SEUL message multipart contenant
    // éventuellement le texte. Cela évite de compter texte + fichier comme
    // deux messages gratuits.
    if (attachment?.file) {
      const formData = new FormData();
      formData.append("file", attachment.file);
      if (text?.trim()) {
        formData.append("contenu", text.trim());
      }

      const response = await apiClient.post(
        `/conversations/${conversationId}/documents`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    }

    if (!text?.trim()) {
      throw new Error("Le message ne peut pas être vide.");
    }

    const response = await apiClient.post(
      `/conversations/${conversationId}/messages`,
      { text: text.trim() }
    );
    return response.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Impossible d'envoyer le message pour le moment."
    );
  }
}

export async function updateConversationStatus(conversationId, status) {
  if (USE_MOCKS) {
    await delay(300);
    const conversation = mockConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error("Conversation introuvable");
    conversation.status = status;
    return conversation;
  }

  try {
    const { data } = await apiClient.put(`/conversations/${conversationId}/status`, {
      statut: status,
    });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.detail || "Impossible de mettre à jour le statut."
    );
  }
}

export async function getOrCreateConversation(listingId, listing, counterpartInfo) {
  if (USE_MOCKS) {
    await delay(300);

    const counterpartName = counterpartInfo?.name || "Vendeur";

    let conversation = mockConversations.find(
      (c) => c.listingId === listingId && c.counterpart?.name === counterpartName
    );

    if (!conversation) {
      conversation = {
        id: `c-${Date.now()}`,
        listingId: listingId,
        listingProduct: listing?.product || "Annonce",
        counterpart: counterpartInfo || { name: "Vendeur", country: "Non spécifié" },
        status: "suggested",
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      mockConversations.push(conversation);
    }

    return conversation;
  }

  // Backend réel : POST /conversations crée (ou réouvre, s'il en existe déjà
  // une pour cette paire annonce/destinataire) une conversation persistée.
  const destinataireId = listing?.ownerId;
  if (!destinataireId) {
    throw new Error(
      "Impossible d'identifier le propriétaire de cette annonce."
    );
  }

  try {
    const { data } = await apiClient.post("/conversations", {
      destinataire_id: destinataireId,
      listing_id: listingId,
    });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.detail || "Impossible de démarrer la conversation."
    );
  }
}

export { CURRENT_USER_ID };

export async function markConversationRead(conversationId) {
  if (USE_MOCKS) {
    const conversation = mockConversations.find((c) => String(c.id) === String(conversationId));
    if (conversation) {
      conversation.messages.forEach((m) => {
        if (String(m.senderId) !== String(CURRENT_USER_ID)) m.lu = true;
      });
      conversation.unreadCount = 0;
    }
    return { conversation_id: conversationId, unreadCount: 0 };
  }
  const { data } = await apiClient.patch(`/conversations/${conversationId}/read`);
  return data;
}
