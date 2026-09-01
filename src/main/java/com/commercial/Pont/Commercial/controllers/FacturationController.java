package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.FacturationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController
@RequestMapping("/api/facturations")
@RequiredArgsConstructor
@Tag(
        name = "Facturation",
        description = "Gestion des factures et des informations de facturation de la plateforme"
)
public class FacturationController {

    private final FacturationServiceInterface facturationService;


    // =========================
    // CREATE
    // =========================
    @Operation(
            summary = "Créer une facturation",
            description = "Crée un nouvel enregistrement de facturation."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Facturation créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de facturation invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping
    public ResponseEntity<FacturationResponseDto> create(
            @RequestBody FacturationRequestDto facturationRequestDto
    ) {

        FacturationResponseDto response =
                facturationService.create(
                        facturationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================
    @Operation(
            summary = "Modifier une facturation",
            description = "Modifie une facturation existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Facturation modifiée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Facturation introuvable")
    })
    @PutMapping("/{facturationId}")
    public ResponseEntity<FacturationResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de la facturation",
                    required = true
            )
            @PathVariable UUID facturationId,
            @RequestBody FacturationRequestDto facturationRequestDto
    ) {

        FacturationResponseDto response =
                facturationService.update(
                        facturationId,
                        facturationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================
    @Operation(
            summary = "Récupérer une facturation",
            description = "Retourne une facturation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Facturation récupérée avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Facturation introuvable")
    })
    @GetMapping("/{facturationId}")
    public ResponseEntity<FacturationResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de la facturation",
                    required = true
            )
            @PathVariable UUID facturationId
    ) {

        FacturationResponseDto response =
                facturationService.getById(
                        facturationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================
    @Operation(
            summary = "Lister toutes les facturations",
            description = "Retourne toutes les facturations enregistrées."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Facturations récupérées avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping
    public ResponseEntity<List<FacturationResponseDto>> getAll() {

        List<FacturationResponseDto> response =
                facturationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================
    @Operation(
            summary = "Supprimer une facturation",
            description = "Supprime une facturation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Facturation supprimée avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Facturation introuvable")
    })
    @DeleteMapping("/{facturationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID facturationId
    ) {

        facturationService.delete(
                facturationId
        );

        return ResponseEntity.noContent().build();
    }
}