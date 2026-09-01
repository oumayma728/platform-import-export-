package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.EntrepriseServiceInterface;
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
@RequestMapping("/entreprises")
@RequiredArgsConstructor
@Tag(
        name = "Entreprises",
        description = "Gestion des entreprises importatrices et exportatrices de la plateforme"
)
public class EntrepriseController {

    private final EntrepriseServiceInterface entrepriseService;


    // =========================
    // CREATE
    // =========================
    @Operation(
            summary = "Créer une entreprise",
            description = "Crée une nouvelle entreprise."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Entreprise créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'entreprise invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "409", description = "Entreprise déjà existante")
    })
    @PostMapping("/createEntreprise")
    public ResponseEntity<EntrepriseResponseDto> create(
            @RequestBody EntrepriseRequestDto entrepriseRequestDto
    ) {

        EntrepriseResponseDto response =
                entrepriseService.create(
                        entrepriseRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================
    @Operation(
            summary = "Modifier une entreprise",
            description = "Modifie les informations d'une entreprise existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Entreprise modifiée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Entreprise introuvable"),
            @ApiResponse(responseCode = "409", description = "Informations uniques déjà utilisées")
    })
    @PutMapping("/updateEntreprise/{entrepriseId}")
    public ResponseEntity<EntrepriseResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de l'entreprise",
                    required = true
            )
            @PathVariable UUID entrepriseId,
            @RequestBody EntrepriseRequestDto entrepriseRequestDto
    ) {

        EntrepriseResponseDto response =
                entrepriseService.update(
                        entrepriseId,
                        entrepriseRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================
    @Operation(
            summary = "Récupérer une entreprise",
            description = "Retourne les informations d'une entreprise à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Entreprise récupérée avec succès"),
            @ApiResponse(responseCode = "404", description = "Entreprise introuvable")
    })
    @GetMapping("/getEntreprise/{entrepriseId}")
    public ResponseEntity<EntrepriseResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de l'entreprise",
                    required = true
            )
            @PathVariable UUID entrepriseId
    ) {

        EntrepriseResponseDto response =
                entrepriseService.getById(
                        entrepriseId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================
    @Operation(
            summary = "Lister toutes les entreprises",
            description = "Retourne la liste de toutes les entreprises enregistrées."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Entreprises récupérées avec succès")
    })
    @GetMapping("/getAllEntreprises")
    public ResponseEntity<List<EntrepriseResponseDto>> getAll() {

        List<EntrepriseResponseDto> response =
                entrepriseService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================
    @Operation(
            summary = "Supprimer une entreprise",
            description = "Supprime une entreprise à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Entreprise supprimée avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Entreprise introuvable"),
            @ApiResponse(responseCode = "409", description = "Entreprise encore utilisée par d'autres ressources")
    })
    @DeleteMapping("/deleteEntreprise/{entrepriseId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID entrepriseId
    ) {

        entrepriseService.delete(
                entrepriseId
        );

        return ResponseEntity.noContent().build();
    }
}