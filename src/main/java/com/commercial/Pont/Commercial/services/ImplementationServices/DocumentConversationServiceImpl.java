package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentConversationMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentConversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.DocumentConversationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentConversationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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


        DocumentConversation savedDocumentConversation =
                documentConversationRepository.save(
                        documentConversation
                );

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
}