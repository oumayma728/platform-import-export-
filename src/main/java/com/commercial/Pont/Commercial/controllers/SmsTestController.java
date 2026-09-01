package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.SmsServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test/sms")
@RequiredArgsConstructor
@Tag(
        name = "Tests SMS",
        description = "Endpoints techniques utilisés pour tester l'intégration du service SMS"
)
public class SmsTestController {

    private final SmsServiceInterface smsService;


    @Operation(
            summary = "Tester l'envoi d'un SMS",
            description = """
                    Envoie un SMS de test afin de vérifier que
                    l'intégration du fournisseur SMS fonctionne correctement.

                    Endpoint destiné principalement aux environnements
                    de développement et de test.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "SMS envoyé avec succès"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de l'envoi du SMS"
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Service SMS temporairement indisponible"
            )
    })
    @PostMapping
    public ResponseEntity<String> sendTestSms() {

        smsService.sendSms(
                "+18777804236",
                "Test SMS depuis Spring Boot - Pont Commercial"
        );

        return ResponseEntity.ok(
                "SMS envoyé avec succès."
        );
    }
}