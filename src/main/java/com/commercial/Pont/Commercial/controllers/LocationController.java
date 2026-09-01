package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.LocationServiceInterface;
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
@RequestMapping("/locations")
@RequiredArgsConstructor
@Tag(
        name = "Locations",
        description = "Gestion des localisations géographiques utilisées par les entreprises et les annonces"
)
public class LocationController {

    private final LocationServiceInterface locationService;


    // =========================
    // CREATE
    // =========================

    @Operation(
            summary = "Créer une localisation",
            description = "Crée une nouvelle localisation géographique."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Localisation créée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données de localisation invalides"
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
    @PostMapping("/createLocation")
    public ResponseEntity<LocationResponseDto> create(
            @RequestBody LocationRequestDto locationRequestDto
    ) {

        LocationResponseDto response =
                locationService.create(
                        locationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @Operation(
            summary = "Modifier une localisation",
            description = "Modifie les informations d'une localisation existante."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Localisation modifiée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données de localisation invalides"
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
                    description = "Localisation introuvable"
            )
    })
    @PutMapping("/updateLocation/{locationId}")
    public ResponseEntity<LocationResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID de la localisation",
                    required = true
            )
            @PathVariable UUID locationId,

            @RequestBody LocationRequestDto locationRequestDto
    ) {

        LocationResponseDto response =
                locationService.update(
                        locationId,
                        locationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

    @Operation(
            summary = "Récupérer une localisation",
            description = "Retourne une localisation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Localisation récupérée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Localisation introuvable"
            )
    })
    @GetMapping("/getLocation/{locationId}")
    public ResponseEntity<LocationResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID de la localisation",
                    required = true
            )
            @PathVariable UUID locationId
    ) {

        LocationResponseDto response =
                locationService.getById(
                        locationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @Operation(
            summary = "Lister toutes les localisations",
            description = "Retourne toutes les localisations enregistrées."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Localisations récupérées avec succès"
            )
    })
    @GetMapping("/getAllLocations")
    public ResponseEntity<List<LocationResponseDto>> getAll() {

        List<LocationResponseDto> response =
                locationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @Operation(
            summary = "Supprimer une localisation",
            description = "Supprime une localisation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Localisation supprimée avec succès"
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
                    description = "Localisation introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "La localisation est encore utilisée"
            )
    })
    @DeleteMapping("/deleteLocation/{locationId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID de la localisation",
                    required = true
            )
            @PathVariable UUID locationId
    ) {

        locationService.delete(
                locationId
        );

        return ResponseEntity.noContent().build();
    }
}