package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.ConversationStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.ConversationMapperInterface;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.ConversationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.access.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ConversationServiceImpl
        implements ConversationServiceInterface {

    private final ConversationRepository conversationRepository;

    private final ConversationMapperInterface conversationMapper;

    private final MessageMapperInterface messageMapper;


    private final UtilisateurRepository utilisateurRepository;

    private final AnnonceRepository annonceRepository;
    private final MessageRepository messageRepository;
    private final DocumentConversationRepository documentConversationRepository;

    // =========================
    // CREATE
    // =========================

    @Override
    public ConversationResponseDto create(
            ConversationRequestDto conversationRequestDto
    ) {

        Conversation conversation =
                conversationMapper.requestToEntity(
                        conversationRequestDto
                );

        LocalDateTime now = LocalDateTime.now();

        conversation.setCreatedAt(now);
        conversation.setUpdatedAt(now);
        conversation.setNombreMessages(0);
        Conversation savedConversation =
                conversationRepository.save(
                        conversation
                );

        return conversationMapper.entityToResponse(
                savedConversation
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public ConversationResponseDto update(
            UUID conversationId,
            ConversationRequestDto conversationRequestDto
    ) {

        Conversation existingConversation =
                conversationRepository.findById(
                                conversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );


        // =========================
        // Informations principales
        // =========================

        existingConversation.setStatut(
                conversationRequestDto.getStatut()
        );

        existingConversation.setDateDernierMessage(
                conversationRequestDto.getDateDernierMessage()
        );


        // =========================
        // Mise à jour automatique
        // =========================

        existingConversation.setUpdatedAt(
                LocalDateTime.now()
        );


        Conversation updatedConversation =
                conversationRepository.save(
                        existingConversation
                );

        return conversationMapper.entityToResponse(
                updatedConversation
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public ConversationResponseDto getById(
            UUID conversationId
    ) {

        Conversation conversation =
                conversationRepository.findById(
                                conversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );

        return conversationMapper.entityToResponse(
                conversation
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponseDto> getAll() {

        return conversationRepository.findAll()
                .stream()
                .map(
                        conversationMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID conversationId
    ) {

        if (!conversationRepository.existsById(
                conversationId
        )) {

            throw new EntityNotFoundException(
                    "Conversation non trouvée avec l'id : "
                            + conversationId
            );
        }

        conversationRepository.deleteById(
                conversationId
        );
    }





    @Override
    public ConversationResponseDto updateStatus(
            UUID conversationId,
            ConversationStatus status
    ) {

        Conversation conversation =
                conversationRepository.findById(
                                conversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );

        conversation.setStatut(status);

        conversation.setUpdatedAt(
                LocalDateTime.now()
        );

        Conversation updatedConversation =
                conversationRepository.save(
                        conversation
                );

        return conversationMapper.entityToResponse(
                updatedConversation
        );
    }







    @Override
    public ConversationResponseDto createMyConversation(
            CreateConversationRequestDto request,
            Authentication authentication
    ) {

        // ==========================================
        // 1. Utilisateur connecté
        // ==========================================

        String email = authentication.getName();

        Utilisateur initiateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );


        // ==========================================
        // 2. Récupérer l'annonce
        // ==========================================

        Annonce annonce =
                annonceRepository
                        .findById(request.getAnnonceId())
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + request.getAnnonceId()
                                )
                        );


        // ==========================================
        // 3. Récupérer le vendeur
        // ==========================================

        Utilisateur destinataire =
                annonce.getUtilisateur();


        // ==========================================
        // 4. Vérifier que l'utilisateur ne contacte
        //    pas sa propre annonce
        // ==========================================

        if (destinataire.getUtilisateurId()
                .equals(initiateur.getUtilisateurId())) {

            throw new IllegalStateException(
                    "Vous ne pouvez pas créer une conversation avec vous-même."
            );
        }


        // ==========================================
        // 5. Vérifier si conversation existe déjà
        // ==========================================

        Optional<Conversation> existingConversation =
                conversationRepository
                        .findByInitiateurAndDestinataireAndAnnonce(
                                initiateur,
                                destinataire,
                                annonce
                        );

        if (existingConversation.isPresent()) {

            return conversationMapper.entityToResponse(
                    existingConversation.get()
            );
        }


        // ==========================================
        // 6. Créer conversation
        // ==========================================

        Conversation conversation =
                new Conversation();

        conversation.setDestinataire(destinataire);

        conversation.setInitiateur(initiateur);

        conversation.setAnnonce(annonce);

        conversation.setStatut(
                ConversationStatus.SUGGEREE
        );

        conversation.setNombreMessages(0);

        conversation.setDateDernierMessage(null);


        LocalDateTime now =
                LocalDateTime.now();

        conversation.setCreatedAt(now);

        conversation.setUpdatedAt(now);


        // ==========================================
        // 7. Sauvegarder
        // ==========================================

        Conversation savedConversation =
                conversationRepository.save(
                        conversation
                );


        return conversationMapper.entityToResponse(
                savedConversation
        );
    }







    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponseDto> getMyConversations(
            Authentication authentication
    ) {

        String email =
                authentication.getName();


        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );


        return conversationRepository
                .findByInitiateurOrDestinataire(
                        utilisateur,
                        utilisateur
                )
                .stream()
                .map(conversationMapper::entityToResponse)
                .toList();
    }






    @Override
    @Transactional(readOnly = true)
    public List<MessageResponseDto> getMessages(
            UUID conversationId,
            Authentication authentication
    ) {

        String email =
                authentication.getName();


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


        // ==========================================
        // Vérifier que l'utilisateur appartient
        // à cette conversation
        // ==========================================

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
                .findByConversationOrderByDateEnvoiAsc(
                        conversation
                )
                .stream()
                .map(messageMapper::entityToResponse)
                .toList();
    }











    @Override
    public ConversationResponseDto updateStatus(
            UUID conversationId,
            ConversationStatus statut,
            Authentication authentication
    ) {

        String email =
                authentication.getName();


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
                conversation.getDestinataire()
                        .getUtilisateurId()
                        .equals(
                                utilisateur.getUtilisateurId()
                        )
                        ||
                        conversation.getInitiateur()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                );


        if (!participant) {

            throw new AccessDeniedException(
                    "Vous ne participez pas à cette conversation."
            );
        }


        conversation.setStatut(statut);

        conversation.setUpdatedAt(
                LocalDateTime.now()
        );


        return conversationMapper.entityToResponse(
                conversationRepository.save(
                        conversation
                )
        );
    }
}