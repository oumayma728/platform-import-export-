package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Message;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MessageMapperImpl
        implements MessageMapperInterface {

    private final ConversationRepository conversationRepository;

    private final UtilisateurRepository utilisateurRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * MessageRequestDto
     *          ↓
     *       Message
     *
     * conversationId → Conversation
     * expediteurId   → Utilisateur
     */
    @Override
    public Message requestToEntity(
            MessageRequestDto messageRequestDto) {

        if (messageRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Conversation
         * ========================================================
         */
        Conversation conversation = null;

        if (messageRequestDto.getConversationId() != null) {

            conversation = conversationRepository
                    .findById(
                            messageRequestDto
                                    .getConversationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur expéditeur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (messageRequestDto.getExpediteurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            messageRequestDto
                                    .getExpediteurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Message
         * ========================================================
         */
        return Message.builder()

                // Informations principales
                .contenu(
                        messageRequestDto.getContenu()
                )
                .estLu(
                        messageRequestDto.getEstLu()
                )
                .dateEnvoi(
                        messageRequestDto.getDateEnvoi()
                )
                .dateLecture(
                        messageRequestDto.getDateLecture()
                )
                .createdAt(
                        messageRequestDto.getCreatedAt()
                )
                .updatedAt(
                        messageRequestDto.getUpdatedAt()
                )

                // Relations
                .conversation(conversation)
                .utilisateur(utilisateur)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Message
     *    ↓
     * MessageRequestDto
     *
     * conversation → conversationId
     * utilisateur  → expediteurId
     */
    @Override
    public MessageRequestDto entityToRequest(
            Message message) {

        if (message == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Conversation
         * ========================================================
         */
        UUID conversationId = null;

        if (message.getConversation() != null) {

            conversationId = message
                    .getConversation()
                    .getConversationId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur expéditeur
         * ========================================================
         */
        UUID expediteurId = null;

        if (message.getUtilisateur() != null) {

            expediteurId = message
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return MessageRequestDto.builder()

                // IDs des relations
                .conversationId(conversationId)
                .expediteurId(expediteurId)

                // Informations principales
                .contenu(
                        message.getContenu()
                )
                .estLu(
                        message.getEstLu()
                )
                .dateEnvoi(
                        message.getDateEnvoi()
                )
                .dateLecture(
                        message.getDateLecture()
                )
                .createdAt(
                        message.getCreatedAt()
                )
                .updatedAt(
                        message.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Message
     *    ↓
     * MessageResponseDto
     *
     * conversation → conversationId
     * utilisateur  → expediteurId
     */
    @Override
    public MessageResponseDto entityToResponse(
            Message message) {

        if (message == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Conversation
         * ========================================================
         */
        UUID conversationId = null;

        if (message.getConversation() != null) {

            conversationId = message
                    .getConversation()
                    .getConversationId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur expéditeur
         * ========================================================
         */
        UUID expediteurId = null;

        if (message.getUtilisateur() != null) {

            expediteurId = message
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return MessageResponseDto.builder()

                // IDs des relations
                .conversationId(conversationId)
                .expediteurId(expediteurId)

                // ID du Message
                .messageId(
                        message.getMessageId()
                )

                // Informations principales
                .contenu(
                        message.getContenu()
                )
                .estLu(
                        message.getEstLu()
                )
                .dateEnvoi(
                        message.getDateEnvoi()
                )
                .dateLecture(
                        message.getDateLecture()
                )
                .createdAt(
                        message.getCreatedAt()
                )
                .updatedAt(
                        message.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * MessageResponseDto
     *          ↓
     *       Message
     *
     * conversationId → Conversation
     * expediteurId   → Utilisateur
     */
    @Override
    public Message responseToEntity(
            MessageResponseDto messageResponseDto) {

        if (messageResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Conversation
         * ========================================================
         */
        Conversation conversation = null;

        if (messageResponseDto.getConversationId() != null) {

            conversation = conversationRepository
                    .findById(
                            messageResponseDto
                                    .getConversationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur expéditeur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (messageResponseDto.getExpediteurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            messageResponseDto
                                    .getExpediteurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Message
         * ========================================================
         */
        return Message.builder()

                // ID du Message
                .messageId(
                        messageResponseDto.getMessageId()
                )

                // Informations principales
                .contenu(
                        messageResponseDto.getContenu()
                )
                .estLu(
                        messageResponseDto.getEstLu()
                )
                .dateEnvoi(
                        messageResponseDto.getDateEnvoi()
                )
                .dateLecture(
                        messageResponseDto.getDateLecture()
                )
                .createdAt(
                        messageResponseDto.getCreatedAt()
                )
                .updatedAt(
                        messageResponseDto.getUpdatedAt()
                )

                // Relations
                .conversation(conversation)
                .utilisateur(utilisateur)

                .build();
    }
}
