package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.responseDtos.LogisticsEstimateDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.LogisticsServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/logistics")
@RequiredArgsConstructor
@Tag(
        name = "Logistique",
        description = "Estimation des distances, coûts et délais logistiques entre différents lieux"
)
public class LogisticsController {

    private final LogisticsServiceInterface logisticsService;


    // =========================================
    // ESTIMATION ENTRE DEUX PAYS
    // =========================================

    @Operation(
            summary = "Estimer la logistique entre deux pays",
            description = """
                    Calcule une estimation logistique entre deux pays.

                    Le résultat peut inclure :
                    - la distance estimée
                    - le coût estimé
                    - le délai estimé
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Estimation logistique calculée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Pays source ou destination invalide"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Localisation introuvable"
            ),
            @ApiResponse(
                    responseCode = "502",
                    description = "Erreur du fournisseur externe de routage ou géolocalisation"
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Service logistique temporairement indisponible"
            )
    })
    @GetMapping("/estimate")
    public ResponseEntity<LogisticsEstimateDto> estimateBetweenCountries(

            @Parameter(
                    description = "Pays d'origine",
                    required = true,
                    example = "Maroc"
            )
            @RequestParam("from")
            String originCountry,

            @Parameter(
                    description = "Pays de destination",
                    required = true,
                    example = "Tunisie"
            )
            @RequestParam("to")
            String destinationCountry

    ) {

        LogisticsEstimateDto response =
                logisticsService.calculateRoute(
                        originCountry,
                        destinationCountry
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // ESTIMATION ENTRE DEUX VILLES
    // =========================================

    @Operation(
            summary = "Estimer la logistique entre deux villes",
            description = """
                    Calcule une estimation logistique précise entre
                    une ville d'origine et une ville de destination.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Estimation logistique calculée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ville ou pays invalide"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ville ou localisation introuvable"
            ),
            @ApiResponse(
                    responseCode = "502",
                    description = "Erreur du fournisseur externe de routage ou géolocalisation"
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Service logistique temporairement indisponible"
            )
    })
    @GetMapping("/estimate/cities")
    public ResponseEntity<LogisticsEstimateDto> estimateBetweenCities(

            @Parameter(
                    description = "Ville d'origine",
                    required = true,
                    example = "Agadir"
            )
            @RequestParam("fromCity")
            String originCity,

            @Parameter(
                    description = "Pays d'origine",
                    required = true,
                    example = "Maroc"
            )
            @RequestParam("fromCountry")
            String originCountry,

            @Parameter(
                    description = "Ville de destination",
                    required = true,
                    example = "Bizerte"
            )
            @RequestParam("toCity")
            String destinationCity,

            @Parameter(
                    description = "Pays de destination",
                    required = true,
                    example = "Tunisie"
            )
            @RequestParam("toCountry")
            String destinationCountry

    ) {

        LogisticsEstimateDto response =
                logisticsService.calculateRoute(
                        originCity,
                        originCountry,
                        destinationCity,
                        destinationCountry
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // ESTIMATION POUR UNE ANNONCE
    // =========================================

    @Operation(
            summary = "Obtenir l'estimation logistique d'une annonce",
            description = """
                    Calcule automatiquement l'estimation logistique
                    correspondant à une annonce pour l'utilisateur authentifié.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Estimation logistique récupérée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Impossible de calculer la logistique pour cette annonce"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Utilisateur non autorisé"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Annonce ou localisation introuvable"
            ),
            @ApiResponse(
                    responseCode = "502",
                    description = "Erreur du service logistique externe"
            )
    })
    @GetMapping("/annonce/{annonceId}")
    public ResponseEntity<LogisticsEstimateDto> getLogisticsForAnnonce(

            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId,

            Authentication authentication
    ) {

        LogisticsEstimateDto response =
                logisticsService.getLogistics(
                        annonceId,
                        authentication
                );

        return ResponseEntity.ok(response);
    }
}