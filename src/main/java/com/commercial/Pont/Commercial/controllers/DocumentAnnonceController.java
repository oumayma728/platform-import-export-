package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentAnnonceServiceInterface;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/documents-annonces")
@RequiredArgsConstructor
@Tag(
        name = "Documents Annonces",
        description = "Gestion des fichiers et documents associés aux annonces"
)
public class DocumentAnnonceController {

    private final DocumentAnnonceServiceInterface
            documentAnnonceService;


    // =========================================================
    // CREATE GENERIC
    // =========================================================
    @Operation(
            summary = "Créer un document d'annonce",
            description = "Crée un enregistrement de document associé à une annonce."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document créé avec succès"),
            @ApiResponse(responseCode = "400", description = "Données du document invalides"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable")
    })
    @PostMapping
    public ResponseEntity<DocumentAnnonceResponseDto> create(
            @RequestBody DocumentAnnonceRequestDto requestDto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        documentAnnonceService.create(
                                requestDto
                        )
                );
    }


    // =========================================================
    // ADD DOCUMENT TO ANNONCE
    // =========================================================
    @Operation(
            summary = "Ajouter un fichier à une annonce",
            description = """
                Téléverse un fichier et l'associe à une annonce existante.

                L'utilisateur authentifié doit être propriétaire de l'annonce.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document ajouté à l'annonce avec succès"),
            @ApiResponse(responseCode = "400", description = "Fichier invalide ou vide"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "L'utilisateur n'est pas propriétaire de l'annonce"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable"),
            @ApiResponse(responseCode = "413", description = "Fichier trop volumineux")
    })
    @PostMapping(
            value = "/annonces/{annonceId}/documents",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DocumentAnnonceResponseDto>
    addDocumentToAnnonce(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId,
            @Parameter(
                    description = "Fichier à associer à l'annonce",
                    required = true
            )
            @RequestPart("file")
            MultipartFile file

    ) {

        DocumentAnnonceResponseDto response =
                documentAnnonceService
                        .addDocumentToAnnonce(
                                annonceId,
                                file
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // GET DOCUMENTS BY ANNONCE
    // =========================================================
    @Operation(
            summary = "Récupérer les documents d'une annonce",
            description = "Retourne tous les documents associés à une annonce."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents récupérés avec succès"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable")
    })
    @GetMapping(
            "/annonces/{annonceId}/documents"
    )
    public ResponseEntity<
            List<DocumentAnnonceResponseDto>
            >
    getDocumentsByAnnonce(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId

    ) {

        return ResponseEntity.ok(

                documentAnnonceService
                        .getDocumentsByAnnonce(
                                annonceId
                        )
        );
    }


    // =========================================================
    // DELETE DOCUMENT FROM ANNONCE
    // =========================================================
    @Operation(
            summary = "Supprimer un document d'une annonce",
            description = """
                Supprime un document associé à une annonce ainsi que
                son fichier stocké lorsque cette suppression est autorisée.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document supprimé avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "L'utilisateur n'est pas propriétaire de l'annonce"),
            @ApiResponse(responseCode = "404", description = "Annonce ou document introuvable"),
            @ApiResponse(
                    responseCode = "400",
                    description = "Le document n'appartient pas à l'annonce indiquée"
            )
    })
    @DeleteMapping(
            "/annonces/{annonceId}/documents/{documentAnnonceId}"
    )
    public ResponseEntity<Void>
    deleteDocumentFromAnnonce(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId,
            @Parameter(
                    description = "Identifiant UUID du document",
                    required = true
            )
            @PathVariable UUID documentAnnonceId

    ) {

        documentAnnonceService
                .deleteDocumentFromAnnonce(
                        annonceId,
                        documentAnnonceId
                );

        return ResponseEntity
                .noContent()
                .build();
    }


    // =========================================================
    // GET BY ID
    // =========================================================
    @Operation(
            summary = "Récupérer un document d'annonce",
            description = "Retourne les informations d'un document à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document récupéré avec succès"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @GetMapping("/{documentAnnonceId}")
    public ResponseEntity<DocumentAnnonceResponseDto>
    getById(
            @Parameter(
                    description = "Identifiant UUID du document d'annonce",
                    required = true
            )
            @PathVariable UUID documentAnnonceId

    ) {

        return ResponseEntity.ok(

                documentAnnonceService
                        .getById(
                                documentAnnonceId
                        )
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================
    @Operation(
            summary = "Lister tous les documents d'annonces",
            description = "Retourne tous les documents d'annonces enregistrés."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents récupérés avec succès")
    })
    @GetMapping
    public ResponseEntity<
            List<DocumentAnnonceResponseDto>
            >
    getAll() {

        return ResponseEntity.ok(
                documentAnnonceService.getAll()
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================
    @Operation(
            summary = "Modifier un document d'annonce",
            description = "Modifie les métadonnées d'un document d'annonce existant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Données du document invalides"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @PutMapping("/{documentAnnonceId}")
    public ResponseEntity<DocumentAnnonceResponseDto>
    update(
            @Parameter(
                    description = "Identifiant UUID du document d'annonce",
                    required = true
            )
            @PathVariable UUID documentAnnonceId,

            @RequestBody
            DocumentAnnonceRequestDto requestDto

    ) {

        return ResponseEntity.ok(

                documentAnnonceService.update(
                        documentAnnonceId,
                        requestDto
                )
        );
    }


    // =========================================================
    // DELETE GENERIC
    // =========================================================
    @Operation(
            summary = "Supprimer un document d'annonce",
            description = "Supprime un document d'annonce à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document supprimé avec succès"),
            @ApiResponse(responseCode = "404", description = "Document introuvable")
    })
    @DeleteMapping("/{documentAnnonceId}")
    public ResponseEntity<Void> delete(
            @Parameter(
                    description = "Identifiant UUID du document d'annonce",
                    required = true
            )
            @PathVariable UUID documentAnnonceId

    ) {

        documentAnnonceService.delete(
                documentAnnonceId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}