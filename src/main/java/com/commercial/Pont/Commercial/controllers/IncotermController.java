package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.IncotermServiceInterface;
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
@RequestMapping("/api/incoterms")
@RequiredArgsConstructor
@Tag(
        name = "Incoterms",
        description = "Gestion des Incoterms disponibles pour les échanges commerciaux internationaux"
)
public class IncotermController {

    private final IncotermServiceInterface incotermService;

    @Operation(
            summary = "Créer un Incoterm",
            description = "Ajoute un nouvel Incoterm à la plateforme."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Incoterm créé avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'Incoterm invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "409", description = "Incoterm déjà existant")
    })
    @PostMapping
    public ResponseEntity<IncotermResponseDto> create(
            @RequestBody IncotermRequestDto incotermRequestDto
    ) {

        IncotermResponseDto response =
                incotermService.create(
                        incotermRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    @Operation(
            summary = "Modifier un Incoterm",
            description = "Modifie les informations d'un Incoterm existant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Incoterm modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Incoterm introuvable"),
            @ApiResponse(responseCode = "409", description = "Un autre Incoterm utilise déjà ces informations")
    })
    @PutMapping("/{incotermId}")
    public ResponseEntity<IncotermResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de l'Incoterm",
                    required = true
            )
            @PathVariable UUID incotermId,
            @RequestBody IncotermRequestDto incotermRequestDto
    ) {

        IncotermResponseDto response =
                incotermService.update(
                        incotermId,
                        incotermRequestDto
                );

        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "Récupérer un Incoterm",
            description = "Retourne les informations d'un Incoterm à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Incoterm récupéré avec succès"),
            @ApiResponse(responseCode = "404", description = "Incoterm introuvable")
    })
    @GetMapping("/{incotermId}")
    public ResponseEntity<IncotermResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de l'Incoterm",
                    required = true
            )
            @PathVariable UUID incotermId
    ) {

        IncotermResponseDto response =
                incotermService.getById(
                        incotermId
                );

        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "Lister tous les Incoterms",
            description = "Retourne la liste de tous les Incoterms disponibles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Incoterms récupérés avec succès")
    })
    @GetMapping
    public ResponseEntity<List<IncotermResponseDto>> getAll() {

        List<IncotermResponseDto> response =
                incotermService.getAll();

        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "Supprimer un Incoterm",
            description = "Supprime un Incoterm à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Incoterm supprimé avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Incoterm introuvable"),
            @ApiResponse(
                    responseCode = "409",
                    description = "Impossible de supprimer un Incoterm encore associé à des annonces"
            )
    })
    @DeleteMapping("/{incotermId}")
    public ResponseEntity<Void> delete(
            @Parameter(
                    description = "Identifiant UUID de l'Incoterm",
                    required = true
            )
            @PathVariable UUID incotermId
    ) {

        incotermService.delete(
                incotermId
        );

        return ResponseEntity.noContent().build();
    }
}