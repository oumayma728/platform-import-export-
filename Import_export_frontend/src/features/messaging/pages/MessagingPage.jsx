import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Paperclip, Send, ArrowLeft, Lock } from "lucide-react";
import { useResourceList } from "../../../hooks/useResourceList";
import { useAuth } from "../../../context/AuthContext";
import {
  getConversations,
  getConversationById,
  sendMessage,
  updateConversationStatus,
  CURRENT_USER_ID,
} from "../api/messages";
import { checkPaywallStatus } from "../../billing/api/billing";
import {
  isAcceptedFile,
  MAX_FILE_SIZE_BYTES,
} from "../../../components/molecules/FileDropzone";
import StatusBadge from "../../../components/molecules/StatusBadge";
import AsyncState from "../../../components/organisms/AsyncState";

const STATUS_FLOW = ["suggested", "in_contact", "negotiating", "concluded"];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { isImageAttachment, getAttachmentUrl } from "../../../utils/attachments";

export default function MessagingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: conversations, isLoading, error, refetch } = useResourceList(getConversations);

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  const selected = sorted.find((c) => c.id === id) || null;

  return (
    <div className="messaging-shell" data-has-selection={selected ? "true" : "false"}>
      {/* Liste des conversations - Sidebar gauche */}
      <div
        style={{
          width: "300px",
          backgroundColor: "white",
          borderRight: "1px solid #E4E2DC",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #E4E2DC" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#14161C", margin: 0 }}>
            Conversations
          </h2>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
            {sorted.length} conversation{sorted.length > 1 ? "s" : ""}
          </p>
        </div>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={sorted.length === 0}
          emptyLabel="Aucune conversation pour l'instant."
        >
          <div style={{ flex: 1, overflowY: "auto" }}>
            {sorted.map((conv) => {
              const isActive = conv.id === id;
              const lastMessage = conv.messages[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  style={{
                    display: "flex",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 12px",
                    border: "none",
                    backgroundColor: isActive ? "#FBF0DC" : "transparent",
                    borderLeft: isActive ? "4px solid #B8720A" : "4px solid transparent",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.target.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.target.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#c7d2fe",
                      color: "#3730a3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {initials(conv.counterpart.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#14161C",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {conv.counterpart.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 6px",
                        fontSize: 11,
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {conv.listingProduct}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "#9ca3af",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: 6,
                      }}
                    >
                      {lastMessage ? lastMessage.text : "Aucun message"}
                    </p>
                    <StatusBadge status={conv.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </AsyncState>
      </div>

      {/* Fil de discussion - Zone principale */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "white",
        }}
      >
        {!selected ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            Sélectionnez une conversation pour commencer
          </div>
        ) : (
          <ConversationThread key={selected.id} conversation={selected} onRefetch={refetch} />
        )}
      </div>
    </div>
  );
}

function ConversationThread({ conversation, onRefetch }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myLogoUrl = user?.profile?.logoUrl || null;
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [usage, setUsage] = useState(null);
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [sendError, setSendError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    refreshPaywallStatus();
  }, [conversation.id]);

  function refreshPaywallStatus() {
    checkPaywallStatus().then(({ isBlocked, usage, isUnlimited }) => {
      setIsBlocked(isBlocked);
      setUsage(usage);
      setIsUnlimited(isUnlimited);
    });
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !attachment) return;
    setIsSending(true);
    setSendError(null);
    try {
      await sendMessage(conversation.id, text.trim(), attachment);
      setText("");
      setAttachment(null);
      setAttachmentError(null);
      await onRefetch();
      refreshPaywallStatus();
    } catch (err) {
      setSendError(err.message);
      setIsBlocked(true);
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(status) {
    await updateConversationStatus(conversation.id, status);
    await onRefetch();
  }

  const currentStepIndex = STATUS_FLOW.indexOf(conversation.status);

  return (
    <>
      {/* En-tête */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #E4E2DC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            type="button"
            className="mobile-back-button"
            onClick={() => navigate("/messages")}
            aria-label="Retour à la liste des conversations"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#B8720A",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#14161C", display: "flex", alignItems: "center", gap: 8 }}>
              {conversation.counterpart.name}
              {conversation.counterpart.role && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#FBF0DC",
                    color: "#B8720A",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {conversation.counterpart.role === "importer"
                    ? "Importateur"
                    : conversation.counterpart.role === "exporter"
                    ? "Exportateur"
                    : conversation.counterpart.role}
                </span>
              )}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              {conversation.listingProduct} · {conversation.counterpart.country}
            </p>
          </div>
        </div>

        {/* Contrôle du statut de mise en relation */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* Le statut actuel est toujours visible, terminal ou pas */}
          <StatusBadge status={conversation.status} />

          {conversation.status !== "rejected" && conversation.status !== "concluded" && (
            <>
              {currentStepIndex >= 0 && currentStepIndex < STATUS_FLOW.length - 1 && (
                <button
                  onClick={() => handleStatusChange(STATUS_FLOW[currentStepIndex + 1])}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid #B8720A",
                    backgroundColor: "#FBF0DC",
                    color: "#B8720A",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Passer à « {statusLabel(STATUS_FLOW[currentStepIndex + 1])} »
                </button>
              )}
              <button
                onClick={() => handleStatusChange("rejected")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #fecaca",
                  backgroundColor: "#fef2f2",
                  color: "#C22D2D",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Rejeter
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {conversation.messages.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", marginTop: 40 }}>
            Aucun message. Lancez la conversation !
          </p>
        )}
        {conversation.messages.map((msg) => {
          const isMine = msg.senderId === CURRENT_USER_ID;
          const avatarName = isMine ? "Moi" : conversation.counterpart.name;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: isMine ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 8,
                alignSelf: isMine ? "flex-end" : "flex-start",
                maxWidth: "70%",
              }}
            >
              <div
                title={avatarName}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: isMine ? "#B8720A" : "#c7d2fe",
                  color: isMine ? "#fff" : "#3730a3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 11,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {isMine && myLogoUrl ? (
                  <img
                    src={myLogoUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initials(avatarName)
                )}
              </div>

              <div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 16,
                    borderBottomRightRadius: isMine ? 4 : 16,
                    borderBottomLeftRadius: isMine ? 16 : 4,
                    backgroundColor: isMine ? "#B8720A" : "#f3f4f6",
                    color: isMine ? "#fff" : "#14161C",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {msg.text}
                  {msg.attachment && (() => {
                    const url = getAttachmentUrl(msg.attachment);
                    const isImage = isImageAttachment(msg.attachment);

                    // Image : miniature cliquable qui ouvre la photo en
                    // taille réelle dans un nouvel onglet.
                    if (isImage && url) {
                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Ouvrir ${msg.attachment.name}`}
                          style={{ display: "block", marginTop: 8 }}
                        >
                          <img
                            src={url}
                            alt={msg.attachment.name}
                            style={{
                              maxWidth: 220,
                              maxHeight: 220,
                              borderRadius: 10,
                              display: "block",
                              cursor: "pointer",
                              objectFit: "cover",
                            }}
                          />
                        </a>
                      );
                    }

                    // Autre document (PDF, etc.) : bandeau cliquable qui
                    // ouvre/télécharge le fichier dans un nouvel onglet.
                    const content = (
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 10,
                          backgroundColor: isMine ? "rgba(255,255,255,0.15)" : "#E4E2DC",
                          fontSize: 12,
                          cursor: url ? "pointer" : "default",
                        }}
                      >
                        <Paperclip size={13} />
                        {msg.attachment.name}
                      </div>
                    );

                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Ouvrir ${msg.attachment.name}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    );
                  })()}
                </div>
                <p
                  style={{
                    margin: "4px 4px 0",
                    fontSize: 11,
                    color: "#9ca3af",
                    textAlign: isMine ? "right" : "left",
                  }}
                >
                  {formatTime(msg.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composeur */}
      {isBlocked ? (
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            backgroundColor: "#fffbeb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Lock size={18} color="#b45309" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#92400e" }}>
                Limite de 50 messages gratuits atteinte
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>
                {sendError || "Passez à un abonnement ou au paiement à l'usage pour continuer à échanger."}
              </p>
            </div>
          </div>
          <Link to="/billing/plans">
            <button
              type="button"
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: 10,
                background: "linear-gradient(135deg,#B8720A,#9C5E08)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Voir les offres
            </button>
          </Link>
        </div>
      ) : (
      <>
        {!isUnlimited && usage && (
          <div
            style={{
              padding: "8px 20px",
              borderTop: "1px solid #f1f5f9",
              backgroundColor: usage.maxChats - usage.usedChats <= 10 ? "#fffbeb" : "#F6F5F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: usage.maxChats - usage.usedChats <= 10 ? "#92400e" : "#6b7280",
              }}
            >
              {usage.maxChats - usage.usedChats <= 10 ? "⚠️ " : "💬 "}
              {Math.max(0, usage.maxChats - usage.usedChats)} message
              {Math.max(0, usage.maxChats - usage.usedChats) > 1 ? "s" : ""} gratuit
              {Math.max(0, usage.maxChats - usage.usedChats) > 1 ? "s" : ""} restant
              {Math.max(0, usage.maxChats - usage.usedChats) > 1 ? "s" : ""} ce mois-ci
            </span>
            {usage.maxChats - usage.usedChats <= 10 && (
              <Link
                to="/billing/plans"
                style={{ fontSize: 12, fontWeight: 700, color: "#B8720A" }}
              >
                Voir les offres →
              </Link>
            )}
          </div>
        )}
      <form
        onSubmit={handleSend}
        style={{
          borderTop: "1px solid #f1f5f9",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {attachmentError && (
          <p style={{ color: "#C22D2D", fontSize: 12, margin: 0 }}>⚠️ {attachmentError}</p>
        )}
        {attachment && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#B8720A",
              backgroundColor: "#FBF0DC",
              padding: "6px 10px",
              borderRadius: 8,
              width: "fit-content",
            }}
          >
            <Paperclip size={12} />
            {attachment.name}
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                setAttachmentError(null);
              }}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#B8720A", fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "1px solid #E4E2DC",
              backgroundColor: "#fff",
              borderRadius: 12,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Joindre un document"
          >
            <Paperclip size={17} color="#6b7280" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!isAcceptedFile(file)) {
                setAttachmentError("Type de fichier non autorisé (PDF ou image uniquement).");
                e.target.value = "";
                return;
              }
              if (file.size > MAX_FILE_SIZE_BYTES) {
                setAttachmentError("Fichier trop volumineux (10 Mo maximum).");
                e.target.value = "";
                return;
              }
              setAttachmentError(null);
              setAttachment({ name: file.name, size: file.size, file });
            }}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez votre message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #E4E2DC",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isSending || (!text.trim() && !attachment)}
            style={{
              border: "none",
              borderRadius: 12,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#B8720A,#9C5E08)",
              cursor: isSending ? "default" : "pointer",
              opacity: isSending || (!text.trim() && !attachment) ? 0.5 : 1,
              flexShrink: 0,
            }}
            aria-label="Envoyer"
          >
            <Send size={17} color="#fff" />
          </button>
        </div>
      </form>
      </>
      )}
    </>
  );
}

function statusLabel(status) {
  const labels = {
    suggested: "Suggérée",
    in_contact: "En contact",
    negotiating: "En négociation",
    concluded: "Conclue",
  };
  return labels[status] || status;
}