package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.AbonnementServiceInterface;
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
@RequestMapping("/api/abonnements")
@RequiredArgsConstructor
@Tag(
        name = "Abonnements",
        description = "Gestion des offres d'abonnement de la plateforme"
)
public class AbonnementController {

    private final AbonnementServiceInterface abonnementService;


    // =========================
    // CREATE
    // =========================
    @Operation(
            summary = "Créer un abonnement",
            description = "Crée une nouvelle offre d'abonnement."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Abonnement créé avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'abonnement invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping
    public ResponseEntity<AbonnementResponseDto> create(
            @RequestBody AbonnementRequestDto abonnementRequestDto
    ) {

        AbonnementResponseDto response =
                abonnementService.create(
                        abonnementRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================
    @Operation(
            summary = "Modifier un abonnement",
            description = "Modifie les informations d'une offre d'abonnement existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Abonnement modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'abonnement invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Abonnement introuvable")
    })
    @PutMapping("/{abonnementId}")
    public ResponseEntity<AbonnementResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de l'abonnement",
                    required = true
            )
            @PathVariable UUID abonnementId,
            @RequestBody AbonnementRequestDto abonnementRequestDto
    ) {

        AbonnementResponseDto response =
                abonnementService.update(
                        abonnementId,
                        abonnementRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================
    @Operation(
            summary = "Récupérer un abonnement",
            description = "Retourne les informations d'un abonnement à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Abonnement récupéré avec succès"),
            @ApiResponse(responseCode = "404", description = "Abonnement introuvable")
    })
    @GetMapping("/{abonnementId}")
    public ResponseEntity<AbonnementResponseDto> getById(
            @PathVariable UUID abonnementId
    ) {

        AbonnementResponseDto response =
                abonnementService.getById(
                        abonnementId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================
    @Operation(
            summary = "Lister les abonnements",
            description = "Retourne la liste de toutes les offres d'abonnement disponibles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des abonnements récupérée avec succès")
    })
    @GetMapping
    public ResponseEntity<List<AbonnementResponseDto>> getAll() {

        List<AbonnementResponseDto> response =
                abonnementService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================
    @Operation(
            summary = "Supprimer un abonnement",
            description = "Supprime une offre d'abonnement à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Abonnement supprimé avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Abonnement introuvable")
    })
    @DeleteMapping("/{abonnementId}")
    public ResponseEntity<Void> delete(
            @Parameter(
                    description = "Identifiant UUID de l'abonnement",
                    required = true
            )
            @PathVariable UUID abonnementId
    ) {

        abonnementService.delete(
                abonnementId
        );

        return ResponseEntity.noContent().build();
    }
}