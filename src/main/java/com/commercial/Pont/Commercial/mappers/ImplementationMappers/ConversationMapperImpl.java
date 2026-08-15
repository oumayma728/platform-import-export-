package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.ConversationMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentConversation;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Message;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.DocumentConversationRepository;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.MessageRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ConversationMapperImpl
        implements ConversationMapperInterface {

    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final FacturationRepository facturationRepository;
    private final MessageRepository messageRepository;
    private final DocumentConversationRepository documentConversationRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * ConversationRequestDto
     *          ↓
     * Conversation
     *
     * Les IDs des relations sont recherchés dans la base de données
     * grâce aux repositories correspondants.
     */
    @Override
    public Conversation requestToEntity(
            ConversationRequestDto conversationRequestDto) {

        if (conversationRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération du initiateur
         * ========================================================
         */
        Utilisateur initiateur = null;

        if (conversationRequestDto.getInitiateurId() != null) {

            initiateur = utilisateurRepository
                    .findById(conversationRequestDto.getInitiateurId())
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de destinataire
         * ========================================================
         */
        Utilisateur destinataire = null;

        if (conversationRequestDto.getDestinataireId() != null) {

            destinataire = utilisateurRepository
                    .findById(conversationRequestDto.getDestinataireId())
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Annonce
         * ========================================================
         */
        Annonce annonce = null;

        if (conversationRequestDto.getAnnonceId() != null) {

            annonce = annonceRepository
                    .findById(conversationRequestDto.getAnnonceId())
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de la Facturation
         * ========================================================
         */
        Facturation facturation = null;

        if (conversationRequestDto.getFacturationId() != null) {

            facturation = facturationRepository
                    .findById(conversationRequestDto.getFacturationId())
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Messages
         * ========================================================
         */
        List<Message> messages = Collections.emptyList();

        if (conversationRequestDto.getMessagesIds() != null
                && !conversationRequestDto.getMessagesIds().isEmpty()) {

            messages = messageRepository.findAllById(
                    conversationRequestDto.getMessagesIds()
            );
        }


        /*
         * ========================================================
         * Récupération des Documents de Conversation
         * ========================================================
         */
        List<DocumentConversation> documentConversations =
                Collections.emptyList();

        if (conversationRequestDto.getDocumentConversationsIds() != null
                && !conversationRequestDto
                .getDocumentConversationsIds()
                .isEmpty()) {

            documentConversations =
                    documentConversationRepository.findAllById(
                            conversationRequestDto
                                    .getDocumentConversationsIds()
                    );
        }


        /*
         * ========================================================
         * Construction de l'entité Conversation
         * ========================================================
         */
        return Conversation.builder()

                // Informations principales
                .statut(conversationRequestDto.getStatut())
                .dateDernierMessage(
                        conversationRequestDto.getDateDernierMessage()
                )

                // Relations ManyToOne / OneToOne
                .initiateur(initiateur)
                .destinataire(destinataire)
                .annonce(annonce)
                .facturation(facturation)

                // Relations OneToMany
                .messages(messages)
                .documentConversations(documentConversations)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Conversation
     *      ↓
     * ConversationRequestDto
     *
     * Les objets des relations sont convertis en leurs UUID.
     */
    @Override
    public ConversationRequestDto entityToRequest(
            Conversation conversation) {

        if (conversation == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID du Initiateur
         * ========================================================
         */
        UUID initiateurId = null;

        if (conversation.getInitiateur() != null) {

            initiateurId = conversation.getInitiateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de destinataire
         * ========================================================
         */
        UUID destinataireId = null;

        if (conversation.getDestinataire() != null) {

            destinataireId = conversation.getDestinataire()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Annonce
         * ========================================================
         */
        UUID annonceId = null;

        if (conversation.getAnnonce() != null) {

            annonceId = conversation.getAnnonce()
                    .getAnnonceId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Facturation
         * ========================================================
         */
        UUID facturationId = null;

        if (conversation.getFacturation() != null) {

            facturationId = conversation.getFacturation()
                    .getFacturationId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Messages
         * ========================================================
         */
        List<UUID> messagesIds = Collections.emptyList();

        if (conversation.getMessages() != null) {

            messagesIds = conversation.getMessages()
                    .stream()
                    .map(Message::getMessageId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Extraction des IDs des Documents Conversation
         * ========================================================
         */
        List<UUID> documentConversationsIds =
                Collections.emptyList();

        if (conversation.getDocumentConversations() != null) {

            documentConversationsIds =
                    conversation.getDocumentConversations()
                            .stream()
                            .map(
                                    DocumentConversation
                                            ::getDocumentConversationId
                            )
                            .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return ConversationRequestDto.builder()

                // IDs des relations
                .initiateurId(initiateurId)
                .destinataireId(destinataireId)
                .annonceId(annonceId)
                .facturationId(facturationId)

                // Informations principales
                .statut(conversation.getStatut())
                .dateDernierMessage(
                        conversation.getDateDernierMessage()
                )

                // IDs des relations OneToMany
                .messagesIds(messagesIds)
                .documentConversationsIds(
                        documentConversationsIds
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Conversation
     *      ↓
     * ConversationResponseDto
     *
     * Les objets des relations sont convertis en leurs UUID.
     */
    @Override
    public ConversationResponseDto entityToResponse(
            Conversation conversation) {

        if (conversation == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID du initiateur
         * ========================================================
         */
        UUID initiateurId = null;

        if (conversation.getInitiateur() != null) {

            initiateurId = conversation.getInitiateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de destinataire
         * ========================================================
         */
        UUID destinataireId = null;

        if (conversation.getDestinataire() != null) {

            destinataireId = conversation.getDestinataire()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Annonce
         * ========================================================
         */
        UUID annonceId = null;

        if (conversation.getAnnonce() != null) {

            annonceId = conversation.getAnnonce()
                    .getAnnonceId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Facturation
         * ========================================================
         */
        UUID facturationId = null;

        if (conversation.getFacturation() != null) {

            facturationId = conversation.getFacturation()
                    .getFacturationId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Messages
         * ========================================================
         */
        List<UUID> messagesIds = Collections.emptyList();

        if (conversation.getMessages() != null) {

            messagesIds = conversation.getMessages()
                    .stream()
                    .map(Message::getMessageId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Extraction des IDs des Documents Conversation
         * ========================================================
         */
        List<UUID> documentConversationsIds =
                Collections.emptyList();

        if (conversation.getDocumentConversations() != null) {

            documentConversationsIds =
                    conversation.getDocumentConversations()
                            .stream()
                            .map(
                                    DocumentConversation
                                            ::getDocumentConversationId
                            )
                            .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return ConversationResponseDto.builder()

                // IDs des relations
                .initiateurId(initiateurId)
                .destinataireId(destinataireId)
                .annonceId(annonceId)
                .facturationId(facturationId)

                // ID de la Conversation
                .conversationId(
                        conversation.getConversationId()
                )

                // Informations principales
                .statut(conversation.getStatut())
                .dateDernierMessage(
                        conversation.getDateDernierMessage()
                )
                .nombreMessages(
                        conversation.getNombreMessages()
                )
                .createdAt(
                        conversation.getCreatedAt()
                )
                .updatedAt(
                        conversation.getUpdatedAt()
                )

                // IDs des relations OneToMany
                .messagesIds(messagesIds)
                .documentConversationsIds(
                        documentConversationsIds
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * ConversationResponseDto
     *          ↓
     * Conversation
     *
     * Les IDs des relations sont recherchés dans la base de données.
     */
    @Override
    public Conversation responseToEntity(
            ConversationResponseDto conversationResponseDto) {

        if (conversationResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération du initiateur
         * ========================================================
         */
        Utilisateur initiateur = null;

        if (conversationResponseDto.getInitiateurId() != null) {

            initiateur = utilisateurRepository
                    .findById(
                            conversationResponseDto.getInitiateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de destinataire
         * ========================================================
         */
        Utilisateur destinataire = null;

        if (conversationResponseDto.getDestinataireId() != null) {

            destinataire = utilisateurRepository
                    .findById(
                            conversationResponseDto.getDestinataireId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Annonce
         * ========================================================
         */
        Annonce annonce = null;

        if (conversationResponseDto.getAnnonceId() != null) {

            annonce = annonceRepository
                    .findById(
                            conversationResponseDto.getAnnonceId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de la Facturation
         * ========================================================
         */
        Facturation facturation = null;

        if (conversationResponseDto.getFacturationId() != null) {

            facturation = facturationRepository
                    .findById(
                            conversationResponseDto.getFacturationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Messages
         * ========================================================
         */
        List<Message> messages = Collections.emptyList();

        if (conversationResponseDto.getMessagesIds() != null
                && !conversationResponseDto
                .getMessagesIds()
                .isEmpty()) {

            messages = messageRepository.findAllById(
                    conversationResponseDto.getMessagesIds()
            );
        }


        /*
         * ========================================================
         * Récupération des Documents Conversation
         * ========================================================
         */
        List<DocumentConversation> documentConversations =
                Collections.emptyList();

        if (conversationResponseDto
                .getDocumentConversationsIds() != null
                && !conversationResponseDto
                .getDocumentConversationsIds()
                .isEmpty()) {

            documentConversations =
                    documentConversationRepository.findAllById(
                            conversationResponseDto
                                    .getDocumentConversationsIds()
                    );
        }


        /*
         * ========================================================
         * Construction de l'entité Conversation
         * ========================================================
         */
        return Conversation.builder()

                // ID
                .conversationId(
                        conversationResponseDto
                                .getConversationId()
                )

                // Informations principales
                .statut(
                        conversationResponseDto.getStatut()
                )
                .dateDernierMessage(
                        conversationResponseDto
                                .getDateDernierMessage()
                )
                .nombreMessages(
                        conversationResponseDto
                                .getNombreMessages()
                )
                .createdAt(
                        conversationResponseDto.getCreatedAt()
                )
                .updatedAt(
                        conversationResponseDto.getUpdatedAt()
                )

                // Relations ManyToOne / OneToOne
                .initiateur(initiateur)
                .destinataire(destinataire)
                .annonce(annonce)
                .facturation(facturation)

                // Relations OneToMany
                .messages(messages)
                .documentConversations(
                        documentConversations
                )

                .build();
    }
}
