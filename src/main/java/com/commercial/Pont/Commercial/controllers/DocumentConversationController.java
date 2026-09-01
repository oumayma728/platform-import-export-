package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentConversationServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/documents-conversations")
@RequiredArgsConstructor
@Tag(
        name = "Documents Conversations",
        description = "Gestion des documents échangés dans les conversations"
)
public class DocumentConversationController {

    private final DocumentConversationServiceInterface
            documentConversationService;


    // =========================================================
    // UPDATE
    // =========================================================

    @Operation(
            summary = "Modifier un document de conversation",
            description = "Modifie les informations d'un document de conversation existant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Données du document invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @PutMapping("/{documentConversationId}")
    public ResponseEntity<DocumentConversationResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID du document de conversation",
                    required = true
            )
            @PathVariable UUID documentConversationId,

            @RequestBody DocumentConversationRequestDto
                    documentConversationRequestDto
    ) {

        DocumentConversationResponseDto response =
                documentConversationService.update(
                        documentConversationId,
                        documentConversationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // GET BY ID
    // =========================================================
    @Operation(
            summary = "Récupérer un document de conversation",
            description = "Retourne un document de conversation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document récupéré avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @GetMapping("/{documentConversationId}")
    public ResponseEntity<DocumentConversationResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID du document de conversation",
                    required = true
            )
            @PathVariable UUID documentConversationId
    ) {

        DocumentConversationResponseDto response =
                documentConversationService.getById(
                        documentConversationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // GET ALL
    // =========================================================
    @Operation(
            summary = "Lister tous les documents de conversations",
            description = "Retourne la liste de tous les documents de conversations enregistrés."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents récupérés avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping
    public ResponseEntity<
            List<DocumentConversationResponseDto>
            > getAll() {

        List<DocumentConversationResponseDto> response =
                documentConversationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // DELETE GENERIC
    // =========================================================
    @Operation(
            summary = "Supprimer un document de conversation",
            description = "Supprime un document de conversation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document supprimé avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @DeleteMapping("/{documentConversationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID documentConversationId
    ) {

        documentConversationService.delete(
                documentConversationId
        );

        return ResponseEntity
                .noContent()
                .build();
    }


    @Operation(
            summary = "Ajouter un document à une conversation",
            description = """
                Téléverse un fichier et l'associe à une conversation.

                L'utilisateur authentifié doit être participant
                à la conversation.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document ajouté avec succès"),
            @ApiResponse(responseCode = "400", description = "Fichier invalide ou quota atteint"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non participant à la conversation"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable"),
            @ApiResponse(responseCode = "413", description = "Fichier trop volumineux")
    })
    @PostMapping(
            value = "/conversations/{conversationId}/documents",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DocumentConversationResponseDto>
    addDocumentToConversation(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,

            @Parameter(
                    description = "Fichier à envoyer dans la conversation",
                    required = true
            )
            @RequestPart("file") MultipartFile file

    ) {

        DocumentConversationResponseDto response =
                documentConversationService
                        .addDocumentToConversation(
                                conversationId,
                                file
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // GET DOCUMENTS BY CONVERSATION
    // =========================================================

    @Operation(
            summary = "Récupérer les documents d'une conversation",
            description = "Retourne tous les documents associés à une conversation."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents récupérés avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non participant à la conversation"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @GetMapping(
            "/conversations/{conversationId}/documents"
    )
    public ResponseEntity<
            List<DocumentConversationResponseDto>> getDocumentsByConversation(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId

    ) {

        List<DocumentConversationResponseDto> response =
                documentConversationService
                        .getDocumentsByConversation(
                                conversationId
                        );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // DELETE DOCUMENT FROM CONVERSATION
    // =========================================================

    @Operation(
            summary = "Supprimer un document d'une conversation",
            description = "Supprime un document associé à une conversation."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document supprimé avec succès"),
            @ApiResponse(responseCode = "400", description = "Le document n'appartient pas à cette conversation"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non participant à la conversation"),
            @ApiResponse(responseCode = "404", description = "Conversation ou document introuvable")
    })
    @DeleteMapping(
            "/conversations/{conversationId}/documents/{documentConversationId}"
    )
    public ResponseEntity<Void>
    deleteDocumentFromConversation(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,

            @Parameter(
                    description = "Identifiant UUID du document",
                    required = true
            )
            @PathVariable UUID documentConversationId

    ) {

        documentConversationService
                .deleteDocumentFromConversation(
                        conversationId,
                        documentConversationId
                );

        return ResponseEntity
                .noContent()
                .build();
    }



    @Operation(
            summary = "Marquer un document comme lu",
            description = "Marque un document reçu dans une conversation comme lu par l'utilisateur authentifié."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document marqué comme lu"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non autorisé"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @PatchMapping("/{documentConversationId}/read")
    public ResponseEntity<DocumentConversationResponseDto> markAsRead(
            @Parameter(
                    description = "Identifiant UUID du document de conversation",
                    required = true
            )
            @PathVariable UUID documentConversationId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                documentConversationService.markAsRead(
                        documentConversationId,
                        authentication
                )
        );
    }
}