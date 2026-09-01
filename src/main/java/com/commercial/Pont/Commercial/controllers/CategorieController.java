package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CategorieServiceInterface;
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
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(
        name = "Categories",
        description = "Gestion des catégories utilisées pour classifier les annonces"
)
public class CategorieController {

    private final CategorieServiceInterface categorieService;


    // =========================
    // CREATE
    // =========================
    @Operation(
            summary = "Créer une catégorie",
            description = "Crée une nouvelle catégorie pouvant être associée aux annonces."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Catégorie créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de la catégorie invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping("/createCategorie")
    public ResponseEntity<CategorieResponseDto> create(
            @RequestBody CategorieRequestDto categorieRequestDto
    ) {

        CategorieResponseDto response =
                categorieService.create(
                        categorieRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================
    @Operation(
            summary = "Modifier une catégorie",
            description = "Modifie les informations d'une catégorie existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Catégorie modifiée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    @PutMapping("/updateCategorie/{categorieId}")
    public ResponseEntity<CategorieResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de la catégorie",
                    required = true
            )
            @PathVariable UUID categorieId,
            @RequestBody CategorieRequestDto categorieRequestDto
    ) {

        CategorieResponseDto response =
                categorieService.update(
                        categorieId,
                        categorieRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================
    @Operation(
            summary = "Récupérer une catégorie",
            description = "Retourne une catégorie à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Catégorie récupérée avec succès"),
            @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    @GetMapping("/getCategorie/{categorieId}")
    public ResponseEntity<CategorieResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de la catégorie",
                    required = true
            )
            @PathVariable UUID categorieId
    ) {

        CategorieResponseDto response =
                categorieService.getById(
                        categorieId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @Operation(
            summary = "Lister toutes les catégories",
            description = "Retourne la liste de toutes les catégories disponibles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des catégories récupérée avec succès")
    })
    @GetMapping("/getAllCategories")
    public ResponseEntity<List<CategorieResponseDto>> getAll() {

        List<CategorieResponseDto> response =
                categorieService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================
    @Operation(
            summary = "Supprimer une catégorie",
            description = "Supprime une catégorie à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Catégorie supprimée avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Catégorie introuvable"),
            @ApiResponse(
                    responseCode = "409",
                    description = "Impossible de supprimer une catégorie encore utilisée"
            )
    })
    @DeleteMapping("/deleteCategorie/{categorieId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID categorieId
    ) {

        categorieService.delete(
                categorieId
        );

        return ResponseEntity.noContent().build();
    }
}