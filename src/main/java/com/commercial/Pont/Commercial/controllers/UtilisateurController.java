package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.UtilisateurServiceInterface;
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
@RequestMapping("/utilisateurs")
@RequiredArgsConstructor
@Tag(
        name = "Utilisateurs",
        description = "Gestion des utilisateurs, profils et validation des comptes de la plateforme"
)
public class UtilisateurController {

    private final UtilisateurServiceInterface utilisateurService;


    // =========================================================
    // CREATE
    // =========================================================

    @Operation(
            summary = "Créer un utilisateur",
            description = """
                    Crée un nouvel utilisateur avec une photo de profil optionnelle.

                    La requête utilise multipart/form-data :

                    - utilisateur : informations JSON de l'utilisateur
                    - photo : photo de profil optionnelle
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Utilisateur créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données utilisateur ou fichier invalides"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Un utilisateur avec cet email existe déjà"
            ),
            @ApiResponse(
                    responseCode = "413",
                    description = "Photo de profil trop volumineuse"
            )
    })
    @PostMapping(
            value = "/createUtilisateur",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<UtilisateurResponseDto> create(

            @Parameter(
                    description = "Informations JSON du nouvel utilisateur",
                    required = true
            )
            @RequestPart("utilisateur")
            UtilisateurRequestDto utilisateurRequestDto,

            @Parameter(
                    description = "Photo de profil optionnelle de l'utilisateur"
            )
            @RequestPart(
                    value = "photo",
                    required = false
            )
            MultipartFile photo
    ) {

        UtilisateurResponseDto response =
                utilisateurService.create(
                        utilisateurRequestDto,
                        photo
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Operation(
            summary = "Modifier un utilisateur",
            description = "Modifie les informations d'un utilisateur existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur modifié avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données utilisateur invalides"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Accès refusé"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Email ou autre information unique déjà utilisée"
            )
    })
    @PutMapping("/updateUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId,

            @RequestBody
            UtilisateurRequestDto utilisateurRequestDto
    ) {

        return ResponseEntity.ok(
                utilisateurService.update(
                        utilisateurId,
                        utilisateurRequestDto
                )
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Operation(
            summary = "Récupérer un utilisateur",
            description = "Retourne les informations d'un utilisateur à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur récupéré avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            )
    })
    @GetMapping("/getUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                utilisateurService.getById(
                        utilisateurId
                )
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Operation(
            summary = "Lister tous les utilisateurs",
            description = "Retourne tous les utilisateurs enregistrés sur la plateforme."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateurs récupérés avec succès"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Accès refusé"
            )
    })
    @GetMapping("/getAllUtilisateurs")
    public ResponseEntity<List<UtilisateurResponseDto>> getAll() {

        return ResponseEntity.ok(
                utilisateurService.getAll()
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Operation(
            summary = "Supprimer un utilisateur",
            description = "Supprime un utilisateur à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Utilisateur supprimé avec succès"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Accès refusé"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Impossible de supprimer l'utilisateur car il possède encore des ressources associées"
            )
    })
    @DeleteMapping("/deleteUtilisateur/{utilisateurId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        utilisateurService.delete(
                utilisateurId
        );

        return ResponseEntity
                .noContent()
                .build();
    }


    // =========================================================
    // VALIDER UTILISATEUR
    // =========================================================

    @Operation(
            summary = "Valider un utilisateur",
            description = """
                    Valide le compte d'un utilisateur actuellement
                    en attente de validation.

                    Cette opération est généralement réservée
                    à l'administration de la plateforme.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur validé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Le statut actuel de l'utilisateur ne permet pas cette opération"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Accès administrateur requis"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            )
    })
    @PatchMapping("/validerUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> validerUtilisateur(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur à valider",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                utilisateurService.validerUtilisateur(
                        utilisateurId
                )
        );
    }


    // =========================================================
    // REJETER UTILISATEUR
    // =========================================================

    @Operation(
            summary = "Rejeter un utilisateur",
            description = """
                    Rejette la demande de validation d'un utilisateur.

                    Cette opération est généralement réservée
                    à l'administration de la plateforme.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur rejeté avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Le statut actuel de l'utilisateur ne permet pas cette opération"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Accès administrateur requis"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            )
    })
    @PatchMapping("/rejeterUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> rejeterUtilisateur(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur à rejeter",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                utilisateurService.rejeterUtilisateur(
                        utilisateurId
                )
        );
    }


    // =========================================================
    // SUSPENDRE UTILISATEUR
    // =========================================================

    @Operation(
            summary = "Suspendre un utilisateur",
            description = """
                    Suspend le compte d'un utilisateur existant.

                    Un utilisateur suspendu peut ensuite être empêché
                    d'accéder aux fonctionnalités protégées de la plateforme.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur suspendu avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Le statut actuel de l'utilisateur ne permet pas cette opération"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Accès administrateur requis"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            )
    })
    @PatchMapping("/suspendreUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> suspendreUtilisateur(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur à suspendre",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                utilisateurService.suspendreUtilisateur(
                        utilisateurId
                )
        );
    }
}