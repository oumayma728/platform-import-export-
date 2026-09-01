package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreatePaymentUsageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageRecommendationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaymentUsageServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payment-usages")
@RequiredArgsConstructor
@Tag(
        name = "Paiement à l'usage",
        description = "Gestion de l'achat de packs de messages et des paiements à l'usage"
)
public class PaymentUsageController {

    private final PaymentUsageServiceInterface paymentUsageService;


    // =========================================================
    // RECOMMANDATION
    // =========================================================

    @Operation(
            summary = "Obtenir une recommandation avant un paiement à l'usage",
            description = """
                    Analyse le nombre de messages que l'utilisateur souhaite acheter
                    et compare le coût du paiement à l'usage avec les offres
                    d'abonnement disponibles.

                    Une recommandation d'abonnement peut être retournée lorsque
                    l'abonnement est plus avantageux.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Recommandation calculée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Nombre de messages ou données invalides"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Opération non autorisée"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur ou offre d'abonnement introuvable"
            )
    })
    @PostMapping("/recommendation")
    public ResponseEntity<PaymentUsageRecommendationResponseDto>
    recommanderAbonnement(

            @Valid
            @RequestBody
            PaymentUsageRequestDto requestDto,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentUsageService
                        .recommanderAbonnement(
                                requestDto,
                                authentication
                        )
        );
    }


    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    @Operation(
            summary = "Créer un paiement à l'usage",
            description = """
                    Crée un PaymentIntent Stripe permettant à l'utilisateur
                    authentifié d'acheter un nombre précis de messages.

                    La validation définitive du paiement et l'ajout des messages
                    sont effectués après réception du webhook Stripe.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "PaymentIntent Stripe créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du paiement à l'usage invalides"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Paiement à l'usage non autorisé pour cet utilisateur"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "L'utilisateur possède déjà un abonnement actif"
            ),
            @ApiResponse(
                    responseCode = "502",
                    description = "Erreur lors de la communication avec Stripe"
            )
    })
    @PostMapping("/create-payment")
    public ResponseEntity<CreatePaymentUsageResponseDto> creerPaiement(

            @Valid
            @RequestBody
            PaymentUsageRequestDto requestDto,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentUsageService
                        .creerPaiementPaymentUsage(
                                requestDto,
                                authentication
                        )
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Operation(
            summary = "Lister tous les paiements à l'usage",
            description = "Retourne tous les paiements à l'usage enregistrés."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiements à l'usage récupérés avec succès"
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
    public ResponseEntity<List<PaymentUsageResponseDto>>
    getAllPaymentUsages() {

        return ResponseEntity.ok(
                paymentUsageService.getAllPaymentUsages()
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Operation(
            summary = "Récupérer un paiement à l'usage",
            description = "Retourne un paiement à l'usage à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiement à l'usage récupéré avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Paiement à l'usage introuvable"
            )
    })
    @GetMapping("/{paymentUsageId}")
    public ResponseEntity<PaymentUsageResponseDto>
    getPaymentUsageById(

            @Parameter(
                    description = "Identifiant UUID du paiement à l'usage",
                    required = true
            )
            @PathVariable UUID paymentUsageId
    ) {

        return ResponseEntity.ok(
                paymentUsageService.getPaymentUsageById(
                        paymentUsageId
                )
        );
    }


    // =========================================================
    // GET BY UTILISATEUR
    // =========================================================

    @Operation(
            summary = "Lister les paiements à l'usage d'un utilisateur",
            description = "Retourne l'historique des paiements à l'usage d'un utilisateur."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiements à l'usage récupérés avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur introuvable"
            )
    })
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<PaymentUsageResponseDto>>
    getPaymentUsagesByUtilisateur(

            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                paymentUsageService
                        .getPaymentUsagesByUtilisateur(
                                utilisateurId
                        )
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Operation(
            summary = "Modifier un paiement à l'usage",
            description = "Modifie les informations d'un paiement à l'usage existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paiement à l'usage modifié avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Paiement à l'usage introuvable"
            )
    })
    @PutMapping("/{paymentUsageId}")
    public ResponseEntity<PaymentUsageResponseDto>
    updatePaymentUsage(

            @Parameter(
                    description = "Identifiant UUID du paiement à l'usage",
                    required = true
            )
            @PathVariable UUID paymentUsageId,

            @Valid
            @RequestBody
            PaymentUsageRequestDto requestDto
    ) {

        return ResponseEntity.ok(
                paymentUsageService.updatePaymentUsage(
                        paymentUsageId,
                        requestDto
                )
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Operation(
            summary = "Supprimer un paiement à l'usage",
            description = "Supprime un paiement à l'usage à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Paiement à l'usage supprimé avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Paiement à l'usage introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Le paiement à l'usage est encore lié à une facturation ou un paiement"
            )
    })
    @DeleteMapping("/{paymentUsageId}")
    public ResponseEntity<Void>
    deletePaymentUsage(

            @Parameter(
                    description = "Identifiant UUID du paiement à l'usage",
                    required = true
            )
            @PathVariable UUID paymentUsageId
    ) {

        paymentUsageService.deletePaymentUsage(
                paymentUsageId
        );

        return ResponseEntity.noContent().build();
    }
}