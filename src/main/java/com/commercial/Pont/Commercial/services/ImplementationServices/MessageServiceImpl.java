package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.dtos.websocket.ConversationEventDto;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.MessageServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageServiceImpl implements MessageServiceInterface {

    private final MessageRepository messageRepository;

    private final MessageMapperInterface messageMapper;

    private final ConversationRepository conversationRepository;

    private final UtilisateurRepository utilisateurRepository;
    private final FacturationRepository facturationRepository;

    private final SimpMessagingTemplate messagingTemplate;

    private final FacturationServiceImpl facturationService;

    private final SubscriptionRepository subscriptionRepository;

    private final NotificationServiceInterface notificationService;
    // =========================
    // CREATE
    // =========================

    @Override
    @Transactional
    public MessageResponseDto create(
            MessageRequestDto messageRequestDto
    ) {

        // =========================
        // Recherche de la conversation
        // =========================

        Conversation conversation =
                conversationRepository.findById(
                                messageRequestDto.getConversationId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + messageRequestDto.getConversationId()
                                )
                        );


        // =========================
        // Recherche de l'expéditeur
        // =========================

        Utilisateur utilisateur =
                utilisateurRepository.findById(
                                messageRequestDto.getExpediteurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + messageRequestDto.getExpediteurId()
                                )
                        );


        // =========================
        // Transformation DTO → Entity
        // =========================

        Message message =
                messageMapper.requestToEntity(
                        messageRequestDto
                );


        UUID expediteurId =
                messageRequestDto.getExpediteurId();

        if (!conversation.getInitiateur()
                .getUtilisateurId()
                .equals(expediteurId)
                &&
                !conversation.getDestinataire()
                        .getUtilisateurId()
                        .equals(expediteurId)) {

            throw new IllegalArgumentException(
                    "Cet utilisateur ne participe pas à cette conversation"
            );
        }


        // =========================
        // Association des relations
        // =========================

        message.setConversation(conversation);

        message.setUtilisateur(utilisateur);


        // =========================
        // Gestion des valeurs par défaut
        // =========================

        LocalDateTime now = LocalDateTime.now();

        if (message.getEstLu() == null) {
            message.setEstLu(false);
        }

        if (message.getDateEnvoi() == null) {
            message.setDateEnvoi(now);
        }

        message.setCreatedAt(now);
        message.setUpdatedAt(now);


        // =========================
        // Sauvegarde du message
        // =========================

        Message savedMessage =
                messageRepository.save(message);


        // =========================
        // Mise à jour de la conversation
        // =========================

        Integer nombreMessages =
                conversation.getNombreMessages();

        if (nombreMessages == null) {
            nombreMessages = 0;
        }

        conversation.setNombreMessages(
                nombreMessages + 1
        );

        conversation.setDateDernierMessage(
                message.getDateEnvoi()
        );

        conversation.setUpdatedAt(now);


        // =========================
        // Sauvegarde de la conversation
        // =========================

        conversationRepository.save(conversation);


        Integer nombreMessagesUtilisees =
                utilisateur.getNombreChatsUtilises();

        utilisateur.setNombreChatsUtilises(
                nombreMessagesUtilisees + 1
        );

        utilisateurRepository.save(utilisateur);
        // =========================
        // Response
        // =========================

        MessageResponseDto response =
                messageMapper.entityToResponse(
                        savedMessage
                );


        // =========================
        // WebSocket
        // =========================

        ConversationEventDto event =
                ConversationEventDto.builder()
                        .type("MESSAGE")
                        .conversationId(
                                conversation.getConversationId()
                        )
                        .data(response)
                        .build();

        messagingTemplate.convertAndSend(
                "/topic/conversations/"
                        + conversation.getConversationId(),
                event
        );

        return response;
    }





    @Override
    @Transactional
    public MessageResponseDto createMyMessage(
            CreateMessageRequestDto messageRequestDto,
            Authentication authentication
    ) {

        // =========================================================
        // 1. Utilisateur connecté
        // =========================================================

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );


        // =========================================================
        // 2. Vérifier l'abonnement
        // =========================================================

        boolean abonne =
                estUtilisateurAbonne(utilisateur);


        // =========================================================
        // 3. Si pas d'abonnement actif
        //    vérifier le quota gratuit
        // =========================================================

        if (!abonne) {

            verifierLimiteMessages(utilisateur);
        }


        // =========================================================
        // 4. Récupérer la conversation
        // =========================================================

        Conversation conversation =
                conversationRepository
                        .findById(
                                messageRequestDto.getConversationId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + messageRequestDto
                                                .getConversationId()
                                )
                        );


        // =========================================================
        // 5. Vérifier que l'utilisateur participe
        // =========================================================

        boolean participant =
                conversation.getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                utilisateur.getUtilisateurId()
                        )
                        ||
                        conversation.getDestinataire()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                );

        if (!participant) {

            throw new AccessDeniedException(
                    "Vous ne participez pas à cette conversation."
            );
        }


        // =========================================================
        // 6. Date actuelle
        // =========================================================

        LocalDateTime now =
                LocalDateTime.now();


        // =========================================================
        // 7. Création du message
        // =========================================================

        Message message =
                Message.builder()
                        .contenu(
                                messageRequestDto.getContenu()
                        )
                        .conversation(
                                conversation
                        )
                        .utilisateur(
                                utilisateur
                        )
                        .estLu(false)
                        .dateLecture(null)
                        .dateEnvoi(now)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();


        // =========================================================
        // 8. Sauvegarder message
        // =========================================================

        Message savedMessage =
                messageRepository.save(message);


        // =========================================================
        // 9. Mise à jour conversation
        // =========================================================

        Integer nombreMessages =
                conversation.getNombreMessages();

        if (nombreMessages == null) {
            nombreMessages = 0;
        }

        conversation.setNombreMessages(
                nombreMessages + 1
        );

        conversation.setDateDernierMessage(now);
        conversation.setUpdatedAt(now);

        conversationRepository.save(conversation);


        // =========================================================
        // 10. Mise à jour quota utilisateur
        // =========================================================

        incrementerNombreChats(
                utilisateur,
                abonne
        );

        utilisateurRepository.save(utilisateur);


        // =========================================================
        // 11. Response
        // =========================================================

        MessageResponseDto response =
                MessageResponseDto.builder()
                        .messageId(savedMessage.getMessageId())
                        .conversationId(conversation.getConversationId())
                        .expediteurId(utilisateur.getUtilisateurId())
                        .contenu(savedMessage.getContenu())
                        .estLu(savedMessage.getEstLu())
                        .dateEnvoi(savedMessage.getDateEnvoi())
                        .dateLecture(savedMessage.getDateLecture())
                        .createdAt(savedMessage.getCreatedAt())
                        .updatedAt(savedMessage.getUpdatedAt())
                        .build();


        // =========================================================
        // 12. WebSocket
        // =========================================================

        ConversationEventDto event =
                ConversationEventDto.builder()
                        .type("MESSAGE")
                        .conversationId(
                                conversation.getConversationId()
                        )
                        .data(response)
                        .build();

        messagingTemplate.convertAndSend(
                "/topic/conversations/"
                        + conversation.getConversationId(),
                event
        );


        Utilisateur destinataire;



        if (
                conversation
                        .getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                utilisateur.getUtilisateurId()
                        )
        ) {

            destinataire =
                    conversation.getDestinataire();

        } else {

            destinataire =
                    conversation.getInitiateur();
        }


        notificationService
                .notifierNouveauMessage(
                        destinataire,
                        utilisateur
                );


        return response;
    }








    @Override
    public MessageResponseDto markAsRead(
            UUID messageId,
            Authentication authentication
    ) {

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );

        Message message =
                messageRepository
                        .findById(messageId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Message non trouvé avec l'id : "
                                                + messageId
                                )
                        );

        Conversation conversation =
                message.getConversation();

        boolean participant =
                conversation.getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                utilisateur.getUtilisateurId()
                        )
                        ||
                        conversation.getDestinataire()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                );

        if (!participant) {
            throw new AccessDeniedException(
                    "Vous ne participez pas à cette conversation."
            );
        }

        // Le destinataire ne peut pas marquer
        // son propre message comme lu
        if (message.getUtilisateur()
                .getUtilisateurId()
                .equals(
                        utilisateur.getUtilisateurId()
                )) {

            throw new IllegalStateException(
                    "Vous ne pouvez pas marquer votre propre message comme lu."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        message.setEstLu(true);
        message.setDateLecture(now);
        message.setUpdatedAt(now);

        Message savedMessage =
                messageRepository.save(message);

        MessageResponseDto response =
                messageMapper.entityToResponse(
                        savedMessage
                );

        // =========================
        // WebSocket MESSAGE_READ
        // =========================

        ConversationEventDto event =
                ConversationEventDto.builder()
                        .type("MESSAGE_READ")
                        .conversationId(
                                conversation.getConversationId()
                        )
                        .data(response)
                        .build();

        messagingTemplate.convertAndSend(
                "/topic/conversations/"
                        + conversation.getConversationId(),
                event
        );

        return response;
    }




    @Override
    @Transactional(readOnly = true)
    public List<MessageResponseDto> getReadMessages(
            UUID conversationId,
            Authentication authentication
    ) {

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );


        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée."
                                )
                        );


        boolean participant =
                conversation.getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                utilisateur.getUtilisateurId()
                        )
                        ||
                        conversation.getDestinataire()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                );


        if (!participant) {

            throw new AccessDeniedException(
                    "Vous ne participez pas à cette conversation."
            );
        }


        return messageRepository
                .findByConversation_ConversationIdAndEstLuTrueOrderByDateEnvoiAsc(
                        conversationId
                )
                .stream()
                .map(messageMapper::entityToResponse)
                .toList();
    }






    @Override
    @Transactional(readOnly = true)
    public List<MessageResponseDto> getUnreadMessages(
            UUID conversationId,
            Authentication authentication
    ) {

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );


        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée."
                                )
                        );


        boolean participant =
                conversation.getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                utilisateur.getUtilisateurId()
                        )
                        ||
                        conversation.getDestinataire()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                );


        if (!participant) {

            throw new AccessDeniedException(
                    "Vous ne participez pas à cette conversation."
            );
        }


        return messageRepository
                .findByConversation_ConversationIdAndEstLuFalseAndUtilisateurNotOrderByDateEnvoiAsc(
                        conversationId,
                        utilisateur
                )
                .stream()
                .map(messageMapper::entityToResponse)
                .toList();
    }
    // =========================
    // UPDATE
    // =========================

    @Override
    public MessageResponseDto update(
            UUID messageId,
            MessageRequestDto messageRequestDto
    ) {

        Message existingMessage =
                messageRepository.findById(
                                messageId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Message non trouvé avec l'id : "
                                                + messageId
                                )
                        );


        // =========================
        // Mise à jour du contenu
        // =========================

        existingMessage.setContenu(
                messageRequestDto.getContenu()
        );

        existingMessage.setEstLu(
                messageRequestDto.getEstLu()
        );

        existingMessage.setDateEnvoi(
                messageRequestDto.getDateEnvoi()
        );

        existingMessage.setDateLecture(
                messageRequestDto.getDateLecture()
        );



        // =========================
        // Mise à jour de la conversation
        // =========================

        if (
                messageRequestDto.getConversationId() != null
                        &&
                        (
                                existingMessage.getConversation() == null
                                        ||
                                        !messageRequestDto
                                                .getConversationId()
                                                .equals(
                                                        existingMessage
                                                                .getConversation()
                                                                .getConversationId()
                                                )
                        )
        ) {

            Conversation conversation =
                    conversationRepository.findById(
                                    messageRequestDto
                                            .getConversationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Conversation non trouvée avec l'id : "
                                                    + messageRequestDto
                                                    .getConversationId()
                                    )
                            );

            existingMessage.setConversation(
                    conversation
            );
        }


        // =========================
        // Mise à jour de l'expéditeur
        // =========================

        if (
                messageRequestDto.getExpediteurId() != null
                        &&
                        (
                                existingMessage.getUtilisateur() == null
                                        ||
                                        !messageRequestDto
                                                .getExpediteurId()
                                                .equals(
                                                        existingMessage
                                                                .getUtilisateur()
                                                                .getUtilisateurId()
                                                )
                        )
        ) {

            Utilisateur utilisateur =
                    utilisateurRepository.findById(
                                    messageRequestDto
                                            .getExpediteurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé avec l'id : "
                                                    + messageRequestDto
                                                    .getExpediteurId()
                                    )
                            );

            existingMessage.setUtilisateur(
                    utilisateur
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingMessage.setUpdatedAt(
                LocalDateTime.now()
        );


        Message updatedMessage =
                messageRepository.save(
                        existingMessage
                );

        return messageMapper.entityToResponse(
                updatedMessage
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public MessageResponseDto getById(
            UUID messageId
    ) {

        Message message =
                messageRepository.findById(
                                messageId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Message non trouvé avec l'id : "
                                                + messageId
                                )
                        );

        return messageMapper.entityToResponse(
                message
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponseDto> getAll() {

        return messageRepository.findAll()
                .stream()
                .map(
                        messageMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID messageId
    ) {

        if (
                !messageRepository
                        .existsById(
                                messageId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Message non trouvé avec l'id : "
                            + messageId
            );
        }

        messageRepository.deleteById(
                messageId
        );
    }




    @Override
    @Transactional(readOnly = true)
    public List<MessageResponseDto> getByConversationId(
            UUID conversationId
    ) {

        // Vérifier que la conversation existe
        if (!conversationRepository.existsById(conversationId)) {

            throw new EntityNotFoundException(
                    "Conversation non trouvée avec l'id : "
                            + conversationId
            );
        }

        return messageRepository
                .findByConversation_ConversationIdOrderByDateEnvoiAsc(
                        conversationId
                )
                .stream()
                .map(messageMapper::entityToResponse)
                .toList();
    }







    public boolean estUtilisateurAbonne(Utilisateur utilisateur) {

        Optional<Subscription> optionalSubscription = getDerniereSubscription(utilisateur);

        // =========================================
        // Aucun abonnement
        // =========================================

        if (optionalSubscription.isEmpty()) {
            return false;
        }

        Subscription subscription =
                optionalSubscription.get();

        LocalDateTime now =
                LocalDateTime.now();

        // =========================================
        // Abonnement encore valide
        // =========================================

        if (subscription.getDateFin() != null
                && subscription.getDateFin().isAfter(now)) {

            return true;
        }

        // =========================================
        // Abonnement expiré
        // =========================================

        Facturation facturation =
                facturationRepository
                        .findBySubscription(subscription)
                        .orElse(null);

        if (facturation != null) {

            facturation.setStatut(
                    FacturationStatus.ABONNEMENT_EXPIRE
            );

            facturation.setUpdatedAt(now);

            facturationRepository.save(facturation);
        }

        return false;
    }





    public void verifierLimiteMessages(Utilisateur utilisateur) {

        Integer utilise =
                utilisateur.getNombreChatsUtilises();

        Integer maximum =
                utilisateur.getMaxMessagesPossible();

        if (utilise == null) {
            utilise = 0;
        }

        if (maximum == null) {
            maximum = 50;
        }

        // =========================================
        // LIMITE ATTEINTE
        // =========================================

        if (utilise >= maximum) {

            facturationService.mettreFacturationLimiteAtteinte(
                    utilisateur
            );

            notificationService
                    .notifierQuotaAtteint(
                            utilisateur
                    );
            throw new IllegalStateException(
                    "Vous avez atteint votre limite de messages."
            );
        }
    }











    public void incrementerNombreChats(
            Utilisateur utilisateur,
            boolean abonne
    ) {

        Integer nombreActuel =
                utilisateur.getNombreChatsUtilises();

        if (nombreActuel == null) {
            nombreActuel = 0;
        }

        utilisateur.setNombreChatsUtilises(
                nombreActuel + 1
        );

        // =====================================
        // ABONNÉ
        // =====================================

        if (abonne) {

            Integer maximum =
                    utilisateur.getMaxMessagesPossible();

            if (maximum == null) {
                maximum = 0;
            }

            utilisateur.setMaxMessagesPossible(
                    maximum + 1
            );
        }
    }





    public Optional<Subscription> getDerniereSubscription(
            Utilisateur utilisateur
    ) {

        return subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(
                        utilisateur
                );
    }


}