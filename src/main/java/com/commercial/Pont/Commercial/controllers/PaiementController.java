package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaiementServiceInterface;
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
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
@Tag(
        name = "Paiements",
        description = "Gestion des paiements effectués sur la plateforme"
)
public class PaiementController {

    private final PaiementServiceInterface paiementService;


    // =========================================
    // CREATE
    // =========================================

    @Operation(
            summary = "Créer un paiement",
            description = "Crée un nouvel enregistrement de paiement."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Paiement créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du paiement invalides"
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
    @PostMapping
    public ResponseEntity<PaiementResponseDto> create(
            @RequestBody PaiementRequestDto paiementRequestDto
    ) {

        PaiementResponseDto response =
                paiementService.create(
                        paiementRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================
    // UPDATE
    // =========================================

    @Operation(
            summary = "Modifier un paiement",
            description = "Modifie les informations d'un paiement existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiement modifié avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du paiement invalides"
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
                    description = "Paiement introuvable"
            )
    })
    @PutMapping("/{paiementId}")
    public ResponseEntity<PaiementResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID du paiement",
                    required = true
            )
            @PathVariable UUID paiementId,

            @RequestBody PaiementRequestDto paiementRequestDto
    ) {

        return ResponseEntity.ok(
                paiementService.update(
                        paiementId,
                        paiementRequestDto
                )
        );
    }


    // =========================================
    // GET BY ID
    // =========================================

    @Operation(
            summary = "Récupérer un paiement",
            description = "Retourne un paiement à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiement récupéré avec succès"
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
                    description = "Paiement introuvable"
            )
    })
    @GetMapping("/{paiementId}")
    public ResponseEntity<PaiementResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID du paiement",
                    required = true
            )
            @PathVariable UUID paiementId
    ) {

        return ResponseEntity.ok(
                paiementService.getById(
                        paiementId
                )
        );
    }


    // =========================================
    // GET ALL
    // =========================================

    @Operation(
            summary = "Lister tous les paiements",
            description = "Retourne tous les paiements enregistrés dans la plateforme."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiements récupérés avec succès"
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
    @GetMapping
    public ResponseEntity<List<PaiementResponseDto>> getAll() {

        return ResponseEntity.ok(
                paiementService.getAll()
        );
    }


    // =========================================
    // DELETE
    // =========================================

    @Operation(
            summary = "Supprimer un paiement",
            description = "Supprime un paiement à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Paiement supprimé avec succès"
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
                    description = "Paiement introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Le paiement est encore lié à une facturation, un abonnement ou un paiement à l'usage"
            )
    })
    @DeleteMapping("/{paiementId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID du paiement",
                    required = true
            )
            @PathVariable UUID paiementId
    ) {

        paiementService.delete(
                paiementId
        );

        return ResponseEntity.noContent().build();
    }
}