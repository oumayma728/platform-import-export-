package com.commercial.Pont.Commercial.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stripe")
@RequiredArgsConstructor
@Tag(
        name = "Tests Stripe",
        description = "Endpoints techniques utilisés pour tester la connexion avec l'API Stripe"
)
public class StripeTestController {


    @Operation(
            summary = "Tester la connexion avec Stripe",
            description = """
                    Vérifie que la clé API Stripe configurée dans l'application
                    permet de communiquer correctement avec Stripe.

                    L'endpoint tente de récupérer la balance du compte Stripe.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Connexion avec Stripe réussie"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de la communication avec Stripe"
            )
    })
    @GetMapping("/test")
    public ResponseEntity<String> testStripe() {

        try {

            com.stripe.model.Balance balance =
                    com.stripe.model.Balance.retrieve();

            return ResponseEntity.ok(
                    "Stripe connecté avec succès."
            );

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Erreur Stripe : "
                                    + e.getMessage()
                    );
        }
    }
}