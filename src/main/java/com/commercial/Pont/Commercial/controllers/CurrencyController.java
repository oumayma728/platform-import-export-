package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/currency")
@RequiredArgsConstructor
@Tag(
        name = "Conversion de devises",
        description = "Conversion automatique des montants entre différentes devises"
)
public class CurrencyController {

    private final CurrencyConversionServiceInterface
            currencyConversionService;


    @Operation(
            summary = "Convertir un montant entre deux devises",
            description = """
                Convertit un montant d'une devise source vers une devise cible.

                Les taux peuvent être récupérés depuis le cache Redis.
                Si le cache n'est pas disponible, le service de conversion
                peut interroger directement le fournisseur externe.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Montant converti avec succès"),
            @ApiResponse(responseCode = "400", description = "Montant ou devise invalide"),
            @ApiResponse(responseCode = "502", description = "Erreur du fournisseur externe de taux de change"),
            @ApiResponse(responseCode = "503", description = "Service de conversion temporairement indisponible")
    })
    @GetMapping("/convert")
    public ResponseEntity<BigDecimal> convertir(
            @Parameter(
                    description = "Montant à convertir",
                    required = true,
                    example = "100"
            )
            @RequestParam BigDecimal amount,
            @Parameter(
                    description = "Code ISO de la devise source",
                    required = true,
                    example = "EUR"
            )
            @RequestParam String from,
            @Parameter(
                    description = "Code ISO de la devise cible",
                    required = true,
                    example = "USD"
            )
            @RequestParam String to
    ) {

        BigDecimal montantConverti =
                currencyConversionService.convertir(
                        amount,
                        from,
                        to
                );

        return ResponseEntity.ok(montantConverti);
    }
}