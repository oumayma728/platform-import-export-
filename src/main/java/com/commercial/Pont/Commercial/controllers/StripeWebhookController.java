package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaymentUsageServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final SubscriptionServiceInterface subscriptionService;

    private final PaymentUsageServiceInterface paymentUsageService;

    private final ObjectMapper objectMapper;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;


    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(

            @RequestBody String payload,

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