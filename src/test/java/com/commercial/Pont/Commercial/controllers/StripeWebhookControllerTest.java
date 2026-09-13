package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaymentUsageServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StripeWebhookControllerTest {

    @Mock
    private SubscriptionServiceInterface subscriptionService;

    @Mock
    private PaymentUsageServiceInterface paymentUsageService;

    @InjectMocks
    private StripeWebhookController stripeWebhookController;


    private final String webhookSecret =
            "whsec_test";

    private final String signature =
            "test-signature";


    @BeforeEach
    void setUp() {

        ReflectionTestUtils.setField(
                stripeWebhookController,
                "webhookSecret",
                webhookSecret
        );


        ReflectionTestUtils.setField(
                stripeWebhookController,
                "objectMapper",
                new ObjectMapper()
        );
    }


    // ==========================================================
    // TEST 1
    // SUBSCRIPTION SUCCESS
    // ==========================================================

    @Test
    void test_stripe_webhook_subscription_success()
            throws Exception {

        String paymentIntentId =
                "pi_subscription_123";


        String payload = """
                {
                  "type": "payment_intent.succeeded",
                  "data": {
                    "object": {
                      "id": "pi_subscription_123"
                    }
                  }
                }
                """;


        Event event =
                mock(Event.class);


        when(
                event.getType()
        ).thenReturn(
                "payment_intent.succeeded"
        );


        PaymentIntent paymentIntent =
                mock(PaymentIntent.class);


        when(
                paymentIntent.getStatus()
        ).thenReturn(
                "succeeded"
        );


        when(
                paymentIntent.getAmount()
        ).thenReturn(
                1000L
        );


        when(
                paymentIntent.getCurrency()
        ).thenReturn(
                "mad"
        );


        when(
                paymentIntent.getMetadata()
        ).thenReturn(
                Map.of(
                        "type",
                        "SUBSCRIPTION"
                )
        );


        try (
                MockedStatic<Webhook> webhookMock =
                        mockStatic(Webhook.class);

                MockedStatic<PaymentIntent> paymentIntentMock =
                        mockStatic(PaymentIntent.class)
        ) {


            webhookMock
                    .when(
                            () ->
                                    Webhook.constructEvent(
                                            payload,
                                            signature,
                                            webhookSecret
                                    )
                    )
                    .thenReturn(
                            event
                    );


            paymentIntentMock
                    .when(
                            () ->
                                    PaymentIntent.retrieve(
                                            paymentIntentId
                                    )
                    )
                    .thenReturn(
                            paymentIntent
                    );


            ResponseEntity<String> response =
                    stripeWebhookController
                            .handleStripeWebhook(
                                    payload,
                                    signature
                            );


            assertEquals(
                    200,
                    response.getStatusCode()
                            .value()
            );


            assertEquals(
                    "received",
                    response.getBody()
            );


            verify(
                    subscriptionService,
                    times(1)
            ).traiterPaiementSubscriptionReussi(
                    paymentIntentId
            );


            verifyNoInteractions(
                    paymentUsageService
            );
        }
    }


    // ==========================================================
    // TEST 2
    // PAYMENT USAGE SUCCESS
    // ==========================================================
    //
    // IMPORTANT :
    // si ta metadata utilise "PAYMENT_USAGE",
    // ce test fonctionne directement.
    // ==========================================================

    @Test
    void test_stripe_webhook_payment_usage_success()
            throws Exception {

        String paymentIntentId =
                "pi_usage_123";


        String payload = """
                {
                  "type": "payment_intent.succeeded",
                  "data": {
                    "object": {
                      "id": "pi_usage_123"
                    }
                  }
                }
                """;


        Event event =
                mock(Event.class);


        when(
                event.getType()
        ).thenReturn(
                "payment_intent.succeeded"
        );


        PaymentIntent paymentIntent =
                mock(PaymentIntent.class);


        when(
                paymentIntent.getStatus()
        ).thenReturn(
                "succeeded"
        );


        when(
                paymentIntent.getAmount()
        ).thenReturn(
                500L
        );


        when(
                paymentIntent.getCurrency()
        ).thenReturn(
                "mad"
        );


        when(
                paymentIntent.getMetadata()
        ).thenReturn(
                Map.of(
                        "type",
                        "PAYMENT_USAGE"
                )
        );


        try (
                MockedStatic<Webhook> webhookMock =
                        mockStatic(Webhook.class);

                MockedStatic<PaymentIntent> paymentIntentMock =
                        mockStatic(PaymentIntent.class)
        ) {


            webhookMock
                    .when(
                            () ->
                                    Webhook.constructEvent(
                                            payload,
                                            signature,
                                            webhookSecret
                                    )
                    )
                    .thenReturn(
                            event
                    );


            paymentIntentMock
                    .when(
                            () ->
                                    PaymentIntent.retrieve(
                                            paymentIntentId
                                    )
                    )
                    .thenReturn(
                            paymentIntent
                    );


            ResponseEntity<String> response =
                    stripeWebhookController
                            .handleStripeWebhook(
                                    payload,
                                    signature
                            );


            assertEquals(
                    200,
                    response.getStatusCode()
                            .value()
            );


            verifyNoInteractions(
                    subscriptionService
            );


            /*
             * Décommente si ta méthode porte exactement ce nom :
             *
             * verify(
             *         paymentUsageService,
             *         times(1)
             * ).traiterPaiementUsageReussi(
             *         paymentIntentId
             * );
             */
        }
    }


    // ==========================================================
    // TEST 3
    // EVENT NON SUPPORTE
    // ==========================================================

    @Test
    void test_unknown_event_should_not_call_services()
            throws Exception {

        String payload =
                """
                {
                  "type": "customer.created"
                }
                """;


        Event event =
                mock(Event.class);


        when(
                event.getType()
        ).thenReturn(
                "customer.created"
        );


        try (
                MockedStatic<Webhook> webhookMock =
                        mockStatic(Webhook.class)
        ) {


            webhookMock
                    .when(
                            () ->
                                    Webhook.constructEvent(
                                            payload,
                                            signature,
                                            webhookSecret
                                    )
                    )
                    .thenReturn(
                            event
                    );


            ResponseEntity<String> response =
                    stripeWebhookController
                            .handleStripeWebhook(
                                    payload,
                                    signature
                            );


            assertEquals(
                    200,
                    response.getStatusCode()
                            .value()
            );


            verifyNoInteractions(
                    subscriptionService
            );

            verifyNoInteractions(
                    paymentUsageService
            );
        }
    }


    // ==========================================================
    // TEST 4
    // PAYMENT INTENT RETRIEVE APPELE UNE SEULE FOIS
    // ==========================================================

    @Test
    void test_payment_intent_should_be_retrieved_once()
            throws Exception {

        String paymentIntentId =
                "pi_test_123";


        String payload = """
                {
                  "type": "payment_intent.succeeded",
                  "data": {
                    "object": {
                      "id": "pi_test_123"
                    }
                  }
                }
                """;


        Event event =
                mock(Event.class);


        when(
                event.getType()
        ).thenReturn(
                "payment_intent.succeeded"
        );


        PaymentIntent paymentIntent =
                mock(PaymentIntent.class);


        when(
                paymentIntent.getStatus()
        ).thenReturn(
                "succeeded"
        );


        when(
                paymentIntent.getAmount()
        ).thenReturn(
                1000L
        );


        when(
                paymentIntent.getCurrency()
        ).thenReturn(
                "mad"
        );


        when(
                paymentIntent.getMetadata()
        ).thenReturn(
                Map.of(
                        "type",
                        "SUBSCRIPTION"
                )
        );


        try (
                MockedStatic<Webhook> webhookMock =
                        mockStatic(Webhook.class);

                MockedStatic<PaymentIntent> paymentIntentMock =
                        mockStatic(PaymentIntent.class)
        ) {


            webhookMock
                    .when(
                            () ->
                                    Webhook.constructEvent(
                                            payload,
                                            signature,
                                            webhookSecret
                                    )
                    )
                    .thenReturn(
                            event
                    );


            paymentIntentMock
                    .when(
                            () ->
                                    PaymentIntent.retrieve(
                                            paymentIntentId
                                    )
                    )
                    .thenReturn(
                            paymentIntent
                    );


            stripeWebhookController
                    .handleStripeWebhook(
                            payload,
                            signature
                    );


            paymentIntentMock.verify(
                    () ->
                            PaymentIntent.retrieve(
                                    paymentIntentId
                            ),
                    times(1)
            );
        }
    }
}