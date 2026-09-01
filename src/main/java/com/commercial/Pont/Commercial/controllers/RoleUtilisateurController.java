package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.RoleUtilisateurServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/roles-utilisateurs")
@RequiredArgsConstructor
@Tag(
        name = "Roles Utilisateurs",
        description = "Gestion des associations entre les utilisateurs et leurs rôles"
)
public class RoleUtilisateurController {

    private final RoleUtilisateurServiceInterface roleUtilisateurService;


    // =========================================================
    // CREATE
    // =========================================================

    @Operation(
            summary = "Créer une association utilisateur-rôle",
            description = "Crée une nouvelle association entre un utilisateur et un rôle."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Association créée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur ou rôle introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Ce rôle est déjà affecté à cet utilisateur"
            )
    })
    @PostMapping
    public ResponseEntity<RoleUtilisateurResponseDto> create(
            @RequestBody RoleUtilisateurRequestDto roleUtilisateurRequestDto
    ) {

        RoleUtilisateurResponseDto response =
                roleUtilisateurService.create(
                        roleUtilisateurRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Operation(
            summary = "Modifier une association utilisateur-rôle",
            description = "Modifie une association existante entre un utilisateur et un rôle."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Association modifiée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Association, utilisateur ou rôle introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Association déjà existante"
            )
    })
    @PutMapping("/{roleUtilisateurId}")
    public ResponseEntity<RoleUtilisateurResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID de l'association utilisateur-rôle",
                    required = true
            )
            @PathVariable UUID roleUtilisateurId,

            @RequestBody
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    ) {

        return ResponseEntity.ok(
                roleUtilisateurService.update(
                        roleUtilisateurId,
                        roleUtilisateurRequestDto
                )
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Operation(
            summary = "Récupérer une association utilisateur-rôle",
            description = "Retourne une association utilisateur-rôle à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Association récupérée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Association introuvable"
            )
    })
    @GetMapping("/{roleUtilisateurId}")
    public ResponseEntity<RoleUtilisateurResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID de l'association utilisateur-rôle",
                    required = true
            )
            @PathVariable UUID roleUtilisateurId
    ) {

        return ResponseEntity.ok(
                roleUtilisateurService.getById(
                        roleUtilisateurId
                )
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Operation(
            summary = "Lister les associations utilisateur-rôle",
            description = "Retourne toutes les associations entre utilisateurs et rôles."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Associations récupérées avec succès"
            )
    })
    @GetMapping
    public ResponseEntity<List<RoleUtilisateurResponseDto>> getAll() {

        return ResponseEntity.ok(
                roleUtilisateurService.getAll()
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Operation(
            summary = "Supprimer une association utilisateur-rôle",
            description = "Supprime une association utilisateur-rôle à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Association supprimée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Association introuvable"
            )
    })
    @DeleteMapping("/{roleUtilisateurId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID de l'association utilisateur-rôle",
                    required = true
            )
            @PathVariable UUID roleUtilisateurId
    ) {

        roleUtilisateurService.delete(
                roleUtilisateurId
        );

        return ResponseEntity.noContent().build();
    }


    // =========================================================
    // AFFECTER ROLE
    // =========================================================

    @Operation(
            summary = "Affecter un rôle à un utilisateur",
            description = "Affecte un rôle existant à un utilisateur existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Rôle affecté à l'utilisateur avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Paramètres invalides"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur ou rôle introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Le rôle est déjà affecté à cet utilisateur"
            )
    })
    @PostMapping("/affecterRoleToUtilisateur")
    public ResponseEntity<RoleUtilisateurResponseDto> affecterRole(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @RequestParam UUID utilisateurId,

            @Parameter(
                    description = "Identifiant UUID du rôle",
                    required = true
            )
            @RequestParam UUID roleId
    ) {

        return ResponseEntity.ok(
                roleUtilisateurService.affecterRoleToUtilisateur(
                        utilisateurId,
                        roleId
                )
        );
    }


    // =========================================================
    // RETIRER ROLE
    // =========================================================

    @Operation(
            summary = "Retirer un rôle d'un utilisateur",
            description = "Supprime l'association entre un utilisateur et un rôle."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Rôle retiré de l'utilisateur avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur, rôle ou association introuvable"
            )
    })
    @DeleteMapping("/retirerRoleDeUtilisateur")
    public ResponseEntity<Void> retirerRole(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @RequestParam UUID utilisateurId,

            @Parameter(
                    description = "Identifiant UUID du rôle",
                    required = true
            )
            @RequestParam UUID roleId
    ) {

        roleUtilisateurService.retirerRoleDeUtilisateur(
                utilisateurId,
                roleId
        );

        return ResponseEntity.noContent().build();
    }
}