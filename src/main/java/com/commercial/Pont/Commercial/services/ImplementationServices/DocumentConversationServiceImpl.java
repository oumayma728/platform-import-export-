package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.websocket.ConversationEventDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentConversationMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentConversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.DocumentConversationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.security.CustomUserDetails;
import com.commercial.Pont.Commercial.services.FileStorageService;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentConversationServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentConversationServiceImpl
        implements DocumentConversationServiceInterface {

    private final DocumentConversationRepository documentConversationRepository;

    private final DocumentConversationMapperInterface documentConversationMapper;

    private final UtilisateurRepository utilisateurRepository;

    private final ConversationRepository conversationRepository;

    private final FileStorageService fileStorageService;

    private final SimpMessagingTemplate messagingTemplate;

    private final MessageServiceImpl messageService;

    private final NotificationServiceInterface notificationService;

    // =========================
    // CREATE
    // =========================

    @Override
    public DocumentConversationResponseDto create(
            DocumentConversationRequestDto documentConversationRequestDto
    ) {

        DocumentConversation documentConversation =
                documentConversationMapper.requestToEntity(
                        documentConversationRequestDto
                );


        // =========================
        // Recherche de l'expéditeur
        // =========================

        Utilisateur expediteur =
                utilisateurRepository.findById(
                                documentConversationRequestDto
                                        .getUtilisateurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + documentConversationRequestDto
                                                .getUtilisateurId()
                                )
                        );


        // =========================
        // Recherche de la conversation
        // =========================

        Conversation conversation =
                conversationRepository.findById(
                                documentConversationRequestDto
                                        .getConversationId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + documentConversationRequestDto
                                                .getConversationId()
                                )
                        );


        // =========================
        // Association des relations
        // =========================

        documentConversation.setExpediteur(
                expediteur
        );

        documentConversation.setConversation(
                conversation
        );


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        documentConversation.setCreatedAt(
                now
        );

        documentConversation.setUpdatedAt(
                now
        );

        documentConversation.setEstLu(
                false
        );
        documentConversation.setDateLecture(
                null
        );

        DocumentConversation savedDocumentConversation =
                documentConversationRepository.save(
                        documentConversation
                );
        Integer nombreMessages =
                conversation.getNombreMessages();

        if (nombreMessages == null) {

            nombreMessages = 0;
        }

        conversation.setNombreMessages(
                nombreMessages + 1
        );

        conversation.setDateDernierMessage(
                now
        );

        conversationRepository.save(
                conversation
        );

        Integer nombreMessagesUtilisees =
                expediteur.getNombreChatsUtilises();

        expediteur.setNombreChatsUtilises(
                nombreMessagesUtilisees + 1
        );

        utilisateurRepository.save(expediteur);


        return documentConversationMapper.entityToResponse(
                savedDocumentConversation
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public DocumentConversationResponseDto update(
            UUID documentConversationId,
            DocumentConversationRequestDto documentConversationRequestDto
    ) {

        DocumentConversation existingDocumentConversation =
                documentConversationRepository.findById(
                                documentConversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document conversation non trouvé avec l'id : "
                                                + documentConversationId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingDocumentConversation.setNomFichier(
                documentConversationRequestDto.getNomFichier()
        );

        existingDocumentConversation.setCheminFichier(
                documentConversationRequestDto.getCheminFichier()
        );

        existingDocumentConversation.setExtension(
                documentConversationRequestDto.getExtension()
        );

        existingDocumentConversation.setTaille(
                documentConversationRequestDto.getTaille()
        );


        // =========================
        // Mise à jour de l'utilisateur
        // =========================

        if (
                documentConversationRequestDto.getUtilisateurId() != null
                        &&
                        !documentConversationRequestDto
                                .getUtilisateurId()
                                .equals(
                                        existingDocumentConversation
                                                .getExpediteur()
                                                .getUtilisateurId()
                                )
        ) {

            Utilisateur expediteur =
                    utilisateurRepository.findById(
                                    documentConversationRequestDto
                                            .getUtilisateurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé avec l'id : "
                                                    + documentConversationRequestDto
                                                    .getUtilisateurId()
                                    )
                            );

            existingDocumentConversation.setExpediteur(
                    expediteur
            );
        }


        // =========================
        // Mise à jour de la conversation
        // =========================

        if (
                documentConversationRequestDto.getConversationId() != null
                        &&
                        !documentConversationRequestDto
                                .getConversationId()
                                .equals(
                                        existingDocumentConversation
                                                .getConversation()
                                                .getConversationId()
                                )
        ) {

            Conversation conversation =
                    conversationRepository.findById(
                                    documentConversationRequestDto
                                            .getConversationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Conversation non trouvée avec l'id : "
                                                    + documentConversationRequestDto
                                                    .getConversationId()
                                    )
                            );

            existingDocumentConversation.setConversation(
                    conversation
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingDocumentConversation.setUpdatedAt(
                LocalDateTime.now()
        );


        DocumentConversation updatedDocumentConversation =
                documentConversationRepository.save(
                        existingDocumentConversation
                );

        return documentConversationMapper.entityToResponse(
                updatedDocumentConversation
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public DocumentConversationResponseDto getById(
            UUID documentConversationId
    ) {

        DocumentConversation documentConversation =
                documentConversationRepository.findById(
                                documentConversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document conversation non trouvé avec l'id : "
                                                + documentConversationId
                                )
                        );

        return documentConversationMapper.entityToResponse(
                documentConversation
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<DocumentConversationResponseDto> getAll() {

        return documentConversationRepository.findAll()
                .stream()
                .map(
                        documentConversationMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID documentConversationId
    ) {

        if (
                !documentConversationRepository
                        .existsById(
                                documentConversationId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Document conversation non trouvé avec l'id : "
                            + documentConversationId
            );
        }

        documentConversationRepository.deleteById(
                documentConversationId
        );
    }






    @Override
    @Transactional
    public DocumentConversationResponseDto addDocumentToConversation(
            UUID conversationId,
            MultipartFile file
    ) {

        // =====================================================
        // Vérification du fichier
        // =====================================================

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Le fichier est obligatoire"
            );
        }


        // =====================================================
        // Utilisateur connecté
        // =====================================================

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "Utilisateur non authentifié"
            );
        }

        String email = authentication.getName();


        // =====================================================
        // Recherche utilisateur
        // =====================================================

        Utilisateur expediteur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'email : "
                                                + email
                                )
                        );


        // =====================================================
        // Vérifier abonnement
        // =====================================================

        boolean abonne =
                messageService.estUtilisateurAbonne(
                        expediteur
                );


        // =====================================================
        // Vérifier quota
        //
        // Un document = un message
        // =====================================================

        if (!abonne) {

            messageService.verifierLimiteMessages(
                    expediteur
            );
        }


        // =====================================================
        // Recherche conversation
        // =====================================================

        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );


        // =====================================================
        // Vérifier participant
        // =====================================================

        boolean participant =

                conversation
                        .getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                expediteur.getUtilisateurId()
                        )

                        ||

                        conversation
                                .getDestinataire()
                                .getUtilisateurId()
                                .equals(
                                        expediteur.getUtilisateurId()
                                );


        if (!participant) {

            throw new AccessDeniedException(
                    "Vous ne participez pas à cette conversation."
            );
        }


        // =====================================================
        // Informations fichier
        // =====================================================

        String nomFichier =
                file.getOriginalFilename();

        if (nomFichier == null
                || nomFichier.isBlank()) {

            throw new IllegalArgumentException(
                    "Nom du fichier invalide"
            );
        }


        String extension = "";

        int lastDot =
                nomFichier.lastIndexOf(".");

        if (lastDot > 0) {

            extension =
                    nomFichier.substring(
                            lastDot + 1
                    );
        }


        Long taille =
                file.getSize();


        // =====================================================
        // Stockage physique
        // =====================================================

        String cheminFichier =
                fileStorageService.store(file);


        // =====================================================
        // Création document
        // =====================================================

        LocalDateTime now =
                LocalDateTime.now();


        DocumentConversation documentConversation =
                DocumentConversation.builder()

                        .nomFichier(nomFichier)

                        .cheminFichier(cheminFichier)

                        .extension(extension)

                        .taille(taille)

                        .estLu(false)

                        .dateLecture(null)

                        .createdAt(now)

                        .updatedAt(now)

                        .expediteur(expediteur)

                        .conversation(conversation)

                        .build();


        // =====================================================
        // Sauvegarde document
        // =====================================================

        DocumentConversation savedDocument =
                documentConversationRepository.save(
                        documentConversation
                );


        // =====================================================
        // Mise à jour conversation
        //
        // Document = message
        // =====================================================

        Integer nombreMessages =
                conversation.getNombreMessages();

        if (nombreMessages == null) {
            nombreMessages = 0;
        }

        conversation.setNombreMessages(
                nombreMessages + 1
        );

        conversation.setDateDernierMessage(
                now
        );

        conversation.setUpdatedAt(
                now
        );

        conversationRepository.save(
                conversation
        );


        // =====================================================
        // Mise à jour quota
        //
        // Même comportement que createMyMessage()
        // =====================================================

        messageService.incrementerNombreChats(
                expediteur,
                abonne
        );

        utilisateurRepository.save(
                expediteur
        );


        // =====================================================
        // Response
        // =====================================================

        DocumentConversationResponseDto response =
                documentConversationMapper
                        .entityToResponse(
                                savedDocument
                        );


        // =====================================================
        // WebSocket
        // =====================================================

        ConversationEventDto event =
                ConversationEventDto.builder()

                        .type("DOCUMENT")

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


        // =====================================================
        // Déterminer destinataire
        // =====================================================

        Utilisateur destinataire;

        if (
                conversation
                        .getInitiateur()
                        .getUtilisateurId()
                        .equals(
                                expediteur.getUtilisateurId()
                        )
        ) {

            destinataire =
                    conversation.getDestinataire();

        } else {

            destinataire =
                    conversation.getInitiateur();
        }


        // =====================================================
        // Notification
        //
        // Document considéré comme nouveau message
        // =====================================================

        notificationService
                .notifierNouveauMessage(
                        destinataire,
                        expediteur
                );


        // =====================================================
        // Retour
        // =====================================================

        return response;
    }


    // =========================================================
    // GET DOCUMENTS BY CONVERSATION
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<DocumentConversationResponseDto>
    getDocumentsByConversation(
            UUID conversationId
    ) {

        // =====================================================
        // Utilisateur connecté
        // =====================================================

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "Utilisateur non authentifié"
            );
        }


        String email = authentication.getName();


        // =====================================================
        // Recherche conversation
        // =====================================================

        Conversation conversation =
                conversationRepository.findById(conversationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );


        // =====================================================
        // Vérifier participant
        // =====================================================

        boolean participant =

                conversation.getInitiateur()
                        .getEmail()
                        .equals(email)

                        ||

                        conversation.getDestinataire()
                                .getEmail()
                                .equals(email);


        if (!participant) {

            throw new IllegalStateException(
                    "Vous ne participez pas à cette conversation"
            );
        }


        // =====================================================
        // Récupération documents
        // =====================================================

        return documentConversationRepository
                .findByConversation_ConversationId(
                        conversationId
                )
                .stream()
                .map(
                        documentConversationMapper::entityToResponse
                )
                .toList();
    }


    // =========================================================
    // DELETE DOCUMENT
    // =========================================================

    @Override
    public void deleteDocumentFromConversation(
            UUID conversationId,
            UUID documentConversationId
    ) {

        // =====================================================
        // Utilisateur connecté
        // =====================================================

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "Utilisateur non authentifié"
            );
        }


        String email = authentication.getName();


        // =====================================================
        // Recherche document
        // =====================================================

        DocumentConversation documentConversation =
                documentConversationRepository
                        .findById(documentConversationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document non trouvé avec l'id : "
                                                + documentConversationId
                                )
                        );


        // =====================================================
        // Vérifier conversation
        // =====================================================

        Conversation conversation =
                documentConversation.getConversation();


        if (!conversation
                .getConversationId()
                .equals(conversationId)) {

            throw new IllegalArgumentException(
                    "Ce document n'appartient pas à cette conversation"
            );
        }


        // =====================================================
        // Vérifier participant
        // =====================================================

        boolean participant =

                conversation.getInitiateur()
                        .getEmail()
                        .equals(email)

                        ||

                        conversation.getDestinataire()
                                .getEmail()
                                .equals(email);


        if (!participant) {

            throw new IllegalStateException(
                    "Vous ne participez pas à cette conversation"
            );
        }


        // =====================================================
        // Vérifier que l'utilisateur est l'expéditeur
        // =====================================================

        if (!documentConversation
                .getExpediteur()
                .getEmail()
                .equals(email)) {

            throw new IllegalStateException(
                    "Vous ne pouvez supprimer que vos propres documents"
            );
        }


        // =====================================================
        // Suppression fichier physique
        // =====================================================

        fileStorageService.delete(
                documentConversation.getCheminFichier()
        );


        // =====================================================
        // Suppression DB
        // =====================================================

        documentConversationRepository.delete(
                documentConversation
        );

    }







    @Override
    public DocumentConversationResponseDto markAsRead(
            UUID documentConversationId,
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

        DocumentConversation document =
                documentConversationRepository
                        .findById(documentConversationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document non trouvé."
                                )
                        );

        Conversation conversation =
                document.getConversation();


        // =========================
        // Vérifier le participant
        // =========================

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


        // =========================
        // L'expéditeur ne peut pas
        // marquer son propre document
        // comme lu
        // =========================

        if (document.getExpediteur()
                .getUtilisateurId()
                .equals(
                        utilisateur.getUtilisateurId()
                )) {

            throw new IllegalStateException(
                    "Vous ne pouvez pas marquer votre propre document comme lu."
            );
        }


        // =========================
        // Lecture
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        document.setEstLu(true);

        document.setDateLecture(now);

        document.setUpdatedAt(now);


        DocumentConversation savedDocument =
                documentConversationRepository.save(
                        document
                );


        DocumentConversationResponseDto response =
                documentConversationMapper.entityToResponse(
                        savedDocument
                );


        // =========================
        // WebSocket
        // =========================

        ConversationEventDto event =
                ConversationEventDto.builder()
                        .type("DOCUMENT_READ")
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
}