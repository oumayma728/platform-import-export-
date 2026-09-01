package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaymentUsageServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
@Tag(
        name = "Webhooks Stripe",
        description = "Réception et traitement des événements envoyés par Stripe"
)
public class StripeWebhookController {

    private final SubscriptionServiceInterface subscriptionService;

    private final PaymentUsageServiceInterface paymentUsageService;

    private final ObjectMapper objectMapper;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;


    @Operation(
            summary = "Recevoir les événements Stripe",
            description = """
                    Endpoint webhook appelé automatiquement par Stripe.

                    La signature de la requête est vérifiée grâce au header
                    Stripe-Signature.

                    Événements pris en compte notamment :

                    - payment_intent.succeeded
                    - charge.succeeded
                    - charge.updated
                    - customer.subscription.updated
                    - customer.subscription.deleted

                    Pour payment_intent.succeeded, la metadata `type`
                    permet de déterminer le traitement métier :

                    - SUBSCRIPTION : activation d'un abonnement
                    - PAYMENT_USAGE : validation d'un paiement à l'usage

                    Cet endpoint n'utilise pas l'authentification JWT.
                    """,
            security = {}
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Événement Stripe reçu et traité"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Webhook invalide, signature incorrecte ou PaymentIntent invalide"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur interne lors du traitement du PaymentIntent"
            )
    })
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(

            @Parameter(
                    description = "Payload JSON brut envoyé par Stripe",
                    required = true
            )
            @RequestBody
            String payload,

            @Parameter(
                    description = "Signature du webhook fournie par Stripe",
                    required = true,
                    example = "t=123456789,v1=..."
            )
            @RequestHeader("Stripe-Signature")
            String signature

    ) {

        System.out.println(
                "========== STRIPE WEBHOOK =========="
        );


        Event event;


        // =====================================================
        // 1. Vérifier signature
        // =====================================================

        try {

            event = Webhook.constructEvent(
                    payload,
                    signature,
                    webhookSecret
            );

        } catch (Exception e) {

            System.err.println(
                    ">>> WEBHOOK STRIPE INVALIDE"
            );

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Webhook invalide"
                    );
        }


        // =====================================================
        // 2. Type événement
        // =====================================================

        System.out.println(
                "Event Stripe : "
                        + event.getType()
        );


        // =====================================================
        // 3. PAYMENT INTENT SUCCEEDED
        // =====================================================

        if ("payment_intent.succeeded"
                .equals(event.getType())) {

            try {

                JsonNode root =
                        objectMapper.readTree(
                                payload
                        );


                JsonNode idNode =
                        root
                                .path("data")
                                .path("object")
                                .path("id");


                if (idNode.isMissingNode()
                        || idNode.isNull()) {

                    return ResponseEntity
                            .badRequest()
                            .body(
                                    "PaymentIntent ID introuvable"
                            );
                }


                String paymentIntentId =
                        idNode.asText();


                System.out.println(
                        "PaymentIntent ID : "
                                + paymentIntentId
                );


                PaymentIntent paymentIntent =
                        PaymentIntent.retrieve(
                                paymentIntentId
                        );


                System.out.println(
                        "Montant : "
                                + paymentIntent.getAmount()
                );

                System.out.println(
                        "Devise : "
                                + paymentIntent.getCurrency()
                );

                System.out.println(
                        "Statut : "
                                + paymentIntent.getStatus()
                );

                System.out.println(
                        "Metadata : "
                                + paymentIntent.getMetadata()
                );


                // =================================================
                // Vérifier succeeded
                // =================================================

                if (!"succeeded".equals(
                        paymentIntent.getStatus()
                )) {

                    return ResponseEntity.ok(
                            "received"
                    );
                }


                // =================================================
                // Récupérer type
                // =================================================

                String type =
                        paymentIntent
                                .getMetadata()
                                .get("type");


                if (type == null) {

                    throw new IllegalStateException(
                            "Type PaymentIntent absent."
                    );
                }


                // =================================================
                // SUBSCRIPTION
                // =================================================

                if ("SUBSCRIPTION".equals(type)) {

                    System.out.println(
                            ">>> TYPE = SUBSCRIPTION"
                    );

                    subscriptionService
                            .traiterPaiementSubscriptionReussi(
                                    paymentIntentId
                            );
                }


                // =================================================
                // PAYMENT USAGE
                // =================================================

                else if ("PAYMENT_USAGE"
                        .equals(type)) {

                    System.out.println(
                            ">>> TYPE = PAYMENT_USAGE"
                    );

                    paymentUsageService
                            .traiterPaiementUsageReussi(
                                    paymentIntentId
                            );
                }


                // =================================================
                // TYPE INCONNU
                // =================================================

                else {

                    throw new IllegalStateException(
                            "Type PaymentIntent inconnu : "
                                    + type
                    );
                }


                System.out.println(
                        ">>> TRAITEMENT PAIEMENT TERMINE"
                );

            } catch (Exception e) {

                System.err.println(
                        ">>> ERREUR TRAITEMENT PAYMENT INTENT"
                );

                e.printStackTrace();

                return ResponseEntity
                        .status(500)
                        .body(
                                "Erreur traitement PaymentIntent"
                        );
            }
        }


        // =====================================================
        // 4. CHARGE SUCCEEDED
        // =====================================================

        else if ("charge.succeeded"
                .equals(event.getType())) {

            System.out.println(
                    ">>> CHARGE SUCCEEDED"
            );
        }


        // =====================================================
        // 5. CHARGE UPDATED
        // =====================================================

        else if ("charge.updated"
                .equals(event.getType())) {

            System.out.println(
                    ">>> CHARGE UPDATED"
            );
        }


        // =====================================================
        // 6. SUBSCRIPTION UPDATED
        // =====================================================

        else if ("customer.subscription.updated"
                .equals(event.getType())) {

            System.out.println(
                    ">>> CUSTOMER SUBSCRIPTION UPDATED"
            );
        }


        // =====================================================
        // 7. SUBSCRIPTION DELETED
        // =====================================================

        else if ("customer.subscription.deleted"
                .equals(event.getType())) {

            System.out.println(
                    ">>> CUSTOMER SUBSCRIPTION DELETED"
            );
        }


        // =====================================================
        // 8. AUTRES
        // =====================================================

        else {

            System.out.println(
                    ">>> Événement Stripe non traité : "
                            + event.getType()
            );
        }


        // =====================================================
        // 9. Réponse Stripe
        // =====================================================

        return ResponseEntity.ok(
                "received"
        );
    }
}