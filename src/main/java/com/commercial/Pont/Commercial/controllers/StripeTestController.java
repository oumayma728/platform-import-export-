package com.commercial.Pont.Commercial.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stripe")
@RequiredArgsConstructor
public class StripeTestController {

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
