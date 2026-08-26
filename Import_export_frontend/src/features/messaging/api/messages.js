import { createResourceApi } from "../../../api/createResourceApi";
import apiClient, { USE_MOCKS } from "../../../api/client";
import { delay } from "../../../utils/delay";
import { mockConversations } from "../mocks/messages.mock";
// Couplage volontaire avec le module Facturation : chaque message envoyé
// consomme un crédit de conversation, et l'envoi est bloqué si le paywall
// est actif (plan gratuit + 50 messages déjà utilisés).
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
  const { isBlocked } = await checkPaywallStatus();
  if (isBlocked) {
    throw new Error(
      "Limite de messages gratuits atteinte. Passez à un abonnement pour continuer à échanger."
    );
  }

  if (USE_MOCKS) {
    await delay(300);
    const conversation = mockConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error("Conversation introuvable");

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

  // Envoi réel : si une pièce jointe est présente, on passe par
  // multipart/form-data (nécessaire pour envoyer un fichier binaire).
  let payload;
  let headers;
  if (attachment?.file) {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("file", attachment.file);
    payload = formData;
    headers = { "Content-Type": "multipart/form-data" };
  } else {
    payload = { text };
  }

  try {
    const { data } = await apiClient.post(
      `/conversations/${conversationId}/messages`,
      payload,
      headers ? { headers } : undefined
    );
    await incrementUsage();
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Impossible d'envoyer le message pour le moment."
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
    const { data } = await apiClient.put(`/conversations/${conversationId}`, { status });
    return data;
  } catch {
    return { id: conversationId, status };
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

  try {
    const { data } = await apiClient.post("/conversations/get-or-create", {
      listingId,
      counterpartUserId: counterpartInfo?.id || null,
    });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Impossible de créer ou récupérer la conversation."
    );
  }
}

export { CURRENT_USER_ID };