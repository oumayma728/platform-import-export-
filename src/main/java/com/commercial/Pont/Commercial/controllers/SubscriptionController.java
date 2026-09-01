package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateSubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreateSubscriptionResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
@Tag(
        name = "Subscriptions",
        description = "Gestion des abonnements utilisateurs et création des paiements Stripe associés"
)
public class SubscriptionController {

    private final SubscriptionServiceInterface subscriptionService;


    // =========================================================
    // CREATE SUBSCRIPTION PAYMENT
    // =========================================================

    @Operation(
            summary = "Créer un paiement pour un abonnement",
            description = """
                    Crée un PaymentIntent Stripe pour permettre à
                    l'utilisateur authentifié de souscrire à une offre
                    d'abonnement.

                    L'abonnement est réellement activé après confirmation
                    du paiement par le webhook Stripe.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "PaymentIntent Stripe créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Requête ou abonnement invalide"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur ou offre d'abonnement introuvable"
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
    public ResponseEntity<CreateSubscriptionResponseDto>
    createSubscriptionPayment(

            @RequestBody
            CreateSubscriptionRequestDto request,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                subscriptionService
                        .creerPaiementSubscription(
                                request.getAbonnementId(),
                                authentication
                        )
        );
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Operation(
            summary = "Créer un abonnement",
            description = """
                    Crée directement un enregistrement d'abonnement
                    à partir des informations fournies.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Abonnement utilisateur créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données de l'abonnement invalides"
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
                    description = "Utilisateur ou offre d'abonnement introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Un abonnement actif existe déjà pour cet utilisateur"
            )
    })
    @PostMapping
    public ResponseEntity<SubscriptionResponseDto> create(
            @RequestBody SubscriptionRequestDto subscriptionRequestDto
    ) {

        SubscriptionResponseDto response =
                subscriptionService.create(
                        subscriptionRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Operation(
            summary = "Modifier un abonnement utilisateur",
            description = "Modifie les informations d'un abonnement utilisateur existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Abonnement modifié avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données de l'abonnement invalides"
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
                    description = "Abonnement introuvable"
            )
    })
    @PutMapping("/{subscriptionId}")
    public ResponseEntity<SubscriptionResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID de la souscription",
                    required = true
            )
            @PathVariable UUID subscriptionId,

            @RequestBody
            SubscriptionRequestDto subscriptionRequestDto
    ) {

        return ResponseEntity.ok(
                subscriptionService.update(
                        subscriptionId,
                        subscriptionRequestDto
                )
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Operation(
            summary = "Récupérer un abonnement utilisateur",
            description = """
                    Retourne les informations d'une souscription
                    à partir de son identifiant.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Abonnement récupéré avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Abonnement introuvable"
            )
    })
    @GetMapping("/{subscriptionId}")
    public ResponseEntity<SubscriptionResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID de la souscription",
                    required = true
            )
            @PathVariable UUID subscriptionId
    ) {

        return ResponseEntity.ok(
                subscriptionService.getById(
                        subscriptionId
                )
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Operation(
            summary = "Lister tous les abonnements utilisateurs",
            description = "Retourne toutes les souscriptions enregistrées sur la plateforme."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Abonnements récupérés avec succès"
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
    public ResponseEntity<List<SubscriptionResponseDto>> getAll() {

        return ResponseEntity.ok(
                subscriptionService.getAll()
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Operation(
            summary = "Supprimer un abonnement utilisateur",
            description = "Supprime une souscription à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Abonnement supprimé avec succès"
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
                    description = "Abonnement introuvable"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Impossible de supprimer cet abonnement car il est encore lié à d'autres ressources"
            )
    })
    @DeleteMapping("/{subscriptionId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID de la souscription",
                    required = true
            )
            @PathVariable UUID subscriptionId
    ) {

        subscriptionService.delete(
                subscriptionId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}