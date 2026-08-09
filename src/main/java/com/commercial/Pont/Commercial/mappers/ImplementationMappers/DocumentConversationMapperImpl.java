package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentConversationMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentConversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DocumentConversationMapperImpl
        implements DocumentConversationMapperInterface {

    private final UtilisateurRepository utilisateurRepository;

    private final ConversationRepository conversationRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * DocumentConversationRequestDto
     *              ↓
     * DocumentConversation
     *
     * utilisateurId     → Utilisateur
     * conversationId    → Conversation
     */
    @Override
    public DocumentConversation requestToEntity(
            DocumentConversationRequestDto documentConversationRequestDto) {

        if (documentConversationRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur (Expéditeur)
         * ========================================================
         */
        Utilisateur expediteur = null;

        if (documentConversationRequestDto.getUtilisateurId() != null) {

            expediteur = utilisateurRepository
                    .findById(
                            documentConversationRequestDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de la Conversation
         * ========================================================
         */
        Conversation conversation = null;

        if (documentConversationRequestDto.getConversationId() != null) {

            conversation = conversationRepository
                    .findById(
                            documentConversationRequestDto
                                    .getConversationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de DocumentConversation
         * ========================================================
         */
        return DocumentConversation.builder()

                // Informations du document
                .nomFichier(
                        documentConversationRequestDto.getNomFichier()
                )
                .cheminFichier(
                        documentConversationRequestDto.getCheminFichier()
                )
                .extension(
                        documentConversationRequestDto.getExtension()
                )
                .taille(
                        documentConversationRequestDto.getTaille()
                )
                .createdAt(
                        documentConversationRequestDto.getCreatedAt()
                )
                .updatedAt(
                        documentConversationRequestDto.getUpdatedAt()
                )

                // Relations
                .expediteur(expediteur)
                .conversation(conversation)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * DocumentConversation
     *              ↓
     * DocumentConversationRequestDto
     *
     * expediteur     → utilisateurId
     * conversation   → conversationId
     */
    @Override
    public DocumentConversationRequestDto entityToRequest(
            DocumentConversation documentConversation) {

        if (documentConversation == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (documentConversation.getExpediteur() != null) {

            utilisateurId = documentConversation
                    .getExpediteur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Conversation
         * ========================================================
         */
        UUID conversationId = null;

        if (documentConversation.getConversation() != null) {

            conversationId = documentConversation
                    .getConversation()
                    .getConversationId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return DocumentConversationRequestDto.builder()

                // IDs des relations
                .utilisateurId(utilisateurId)
                .conversationId(conversationId)

                // Informations du document
                .nomFichier(
                        documentConversation.getNomFichier()
                )
                .cheminFichier(
                        documentConversation.getCheminFichier()
                )
                .extension(
                        documentConversation.getExtension()
                )
                .taille(
                        documentConversation.getTaille()
                )
                .createdAt(
                        documentConversation.getCreatedAt()
                )
                .updatedAt(
                        documentConversation.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * DocumentConversation
     *              ↓
     * DocumentConversationResponseDto
     *
     * expediteur     → utilisateurId
     * conversation   → conversationId
     */
    @Override
    public DocumentConversationResponseDto entityToResponse(
            DocumentConversation documentConversation) {

        if (documentConversation == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (documentConversation.getExpediteur() != null) {

            utilisateurId = documentConversation
                    .getExpediteur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Conversation
         * ========================================================
         */
        UUID conversationId = null;

        if (documentConversation.getConversation() != null) {

            conversationId = documentConversation
                    .getConversation()
                    .getConversationId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return DocumentConversationResponseDto.builder()

                // IDs des relations
                .utilisateurId(utilisateurId)
                .conversationId(conversationId)

                // ID du document
                .documentConversationId(
                        documentConversation
                                .getDocumentConversationId()
                )

                // Informations du document
                .nomFichier(
                        documentConversation.getNomFichier()
                )
                .cheminFichier(
                        documentConversation.getCheminFichier()
                )
                .extension(
                        documentConversation.getExtension()
                )
                .taille(
                        documentConversation.getTaille()
                )
                .createdAt(
                        documentConversation.getCreatedAt()
                )
                .updatedAt(
                        documentConversation.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * DocumentConversationResponseDto
     *              ↓
     * DocumentConversation
     *
     * utilisateurId     → Utilisateur
     * conversationId    → Conversation
     */
    @Override
    public DocumentConversation responseToEntity(
            DocumentConversationResponseDto documentConversationResponseDto) {

        if (documentConversationResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur (Expéditeur)
         * ========================================================
         */
        Utilisateur expediteur = null;

        if (documentConversationResponseDto.getUtilisateurId() != null) {

            expediteur = utilisateurRepository
                    .findById(
                            documentConversationResponseDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de la Conversation
         * ========================================================
         */
        Conversation conversation = null;

        if (documentConversationResponseDto.getConversationId() != null) {

            conversation = conversationRepository
                    .findById(
                            documentConversationResponseDto
                                    .getConversationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de DocumentConversation
         * ========================================================
         */
        return DocumentConversation.builder()

                // ID du document
                .documentConversationId(
                        documentConversationResponseDto
                                .getDocumentConversationId()
                )

                // Informations du document
                .nomFichier(
                        documentConversationResponseDto
                                .getNomFichier()
                )
                .cheminFichier(
                        documentConversationResponseDto
                                .getCheminFichier()
                )
                .extension(
                        documentConversationResponseDto
                                .getExtension()
                )
                .taille(
                        documentConversationResponseDto
                                .getTaille()
                )
                .createdAt(
                        documentConversationResponseDto
                                .getCreatedAt()
                )
                .updatedAt(
                        documentConversationResponseDto
                                .getUpdatedAt()
                )

                // Relations
                .expediteur(expediteur)
                .conversation(conversation)

                .build();
    }
}
