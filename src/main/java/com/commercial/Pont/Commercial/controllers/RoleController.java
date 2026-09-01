package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.RoleServiceInterface;
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
@RequestMapping("/roles")
@RequiredArgsConstructor
@Tag(
        name = "Roles",
        description = "Gestion des rôles et permissions fonctionnelles des utilisateurs"
)
public class RoleController {

    private final RoleServiceInterface roleService;


    // =========================================================
    // CREATE
    // =========================================================

    @Operation(
            summary = "Créer un rôle",
            description = "Crée un nouveau rôle utilisateur."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Rôle créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du rôle invalides"
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
                    responseCode = "409",
                    description = "Un rôle avec ce nom existe déjà"
            )
    })
    @PostMapping("/create-Role")
    public ResponseEntity<RoleResponseDto> create(
            @RequestBody RoleRequestDto roleRequestDto
    ) {

        RoleResponseDto response =
                roleService.create(
                        roleRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Operation(
            summary = "Modifier un rôle",
            description = "Modifie les informations d'un rôle existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Rôle modifié avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du rôle invalides"
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
                    description = "Rôle introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Un rôle avec ces informations existe déjà"
            )
    })
    @PutMapping("/updateRole/{roleId}")
    public ResponseEntity<RoleResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID du rôle",
                    required = true
            )
            @PathVariable UUID roleId,

            @RequestBody RoleRequestDto roleRequestDto
    ) {

        return ResponseEntity.ok(
                roleService.update(
                        roleId,
                        roleRequestDto
                )
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Operation(
            summary = "Récupérer un rôle",
            description = "Retourne un rôle à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Rôle récupéré avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Rôle introuvable"
            )
    })
    @GetMapping("/getRole/{roleId}")
    public ResponseEntity<RoleResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID du rôle",
                    required = true
            )
            @PathVariable UUID roleId
    ) {

        return ResponseEntity.ok(
                roleService.getById(
                        roleId
                )
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Operation(
            summary = "Lister tous les rôles",
            description = "Retourne tous les rôles disponibles sur la plateforme."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Rôles récupérés avec succès"
            )
    })
    @GetMapping("/getAllRoles")
    public ResponseEntity<List<RoleResponseDto>> getAll() {

        return ResponseEntity.ok(
                roleService.getAll()
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Operation(
            summary = "Supprimer un rôle",
            description = "Supprime un rôle à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Rôle supprimé avec succès"
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
                    description = "Rôle introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Le rôle est encore affecté à des utilisateurs"
            )
    })
    @DeleteMapping("/deleteRole/{roleId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID du rôle",
                    required = true
            )
            @PathVariable UUID roleId
    ) {

        roleService.delete(
                roleId
        );

        return ResponseEntity.noContent().build();
    }
}