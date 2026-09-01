package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.IncotermAnnonceServiceInterface;
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
@RequestMapping("/api/incoterm-annonces")
@RequiredArgsConstructor
@Tag(
        name = "Incoterms Annonces",
        description = "Gestion des associations entre les annonces et les Incoterms"
)
public class IncotermAnnonceController {

    private final IncotermAnnonceServiceInterface incotermAnnonceService;


    @Operation(
            summary = "Associer un Incoterm à une annonce",
            description = "Crée une nouvelle association entre une annonce et un Incoterm."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Association créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "404", description = "Annonce ou Incoterm introuvable"),
            @ApiResponse(responseCode = "409", description = "Association déjà existante")
    })
    @PostMapping
    public ResponseEntity<IncotermAnnonceResponseDto> create(
            @RequestBody IncotermAnnonceRequestDto incotermAnnonceRequestDto
    ) {

        IncotermAnnonceResponseDto response =
                incotermAnnonceService.create(
                        incotermAnnonceRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    @Operation(
            summary = "Modifier une association annonce-Incoterm",
            description = "Modifie une association existante entre une annonce et un Incoterm."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Association modifiée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "404", description = "Association, annonce ou Incoterm introuvable")
    })
    @PutMapping("/{incotermAnnonceId}")
    public ResponseEntity<IncotermAnnonceResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de l'association annonce-Incoterm",
                    required = true
            )
            @PathVariable UUID incotermAnnonceId,
            @RequestBody IncotermAnnonceRequestDto incotermAnnonceRequestDto
    ) {

        IncotermAnnonceResponseDto response =
                incotermAnnonceService.update(
                        incotermAnnonceId,
                        incotermAnnonceRequestDto
                );

        return ResponseEntity.ok(response);
    }




    @Operation(
            summary = "Récupérer une association annonce-Incoterm",
            description = "Retourne une association entre une annonce et un Incoterm à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Association récupérée avec succès"),
            @ApiResponse(responseCode = "404", description = "Association introuvable")
    })
    @GetMapping("/{incotermAnnonceId}")
    public ResponseEntity<IncotermAnnonceResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de l'association annonce-Incoterm",
                    required = true
            )
            @PathVariable UUID incotermAnnonceId
    ) {

        IncotermAnnonceResponseDto response =
                incotermAnnonceService.getById(
                        incotermAnnonceId
                );

        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "Lister les associations annonce-Incoterm",
            description = "Retourne toutes les associations entre annonces et Incoterms."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Associations récupérées avec succès")
    })
    @GetMapping
    public ResponseEntity<List<IncotermAnnonceResponseDto>> getAll() {

        List<IncotermAnnonceResponseDto> response =
                incotermAnnonceService.getAll();

        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "Supprimer une association annonce-Incoterm",
            description = "Supprime une association entre une annonce et un Incoterm."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Association supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Association introuvable")
    })
    @DeleteMapping("/{incotermAnnonceId}")
    public ResponseEntity<Void> delete(
            @Parameter(
                    description = "Identifiant UUID de l'association annonce-Incoterm",
                    required = true
            )
            @PathVariable UUID incotermAnnonceId
    ) {

        incotermAnnonceService.delete(
                incotermAnnonceId
        );

        return ResponseEntity.noContent().build();
    }
}