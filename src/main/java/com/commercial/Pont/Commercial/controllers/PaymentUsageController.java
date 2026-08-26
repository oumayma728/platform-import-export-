package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreatePaymentUsageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageRecommendationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaymentUsageServiceInterface;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payment-usages")
@RequiredArgsConstructor
public class PaymentUsageController {

    private final PaymentUsageServiceInterface paymentUsageService;


    @PostMapping("/recommendation")
    public ResponseEntity<PaymentUsageRecommendationResponseDto> recommanderAbonnement(

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

    @GetMapping("/{paymentUsageId}")
    public ResponseEntity<PaymentUsageResponseDto>
    getPaymentUsageById(
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

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<PaymentUsageResponseDto>>
    getPaymentUsagesByUtilisateur(
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

    @PutMapping("/{paymentUsageId}")
    public ResponseEntity<PaymentUsageResponseDto>
    updatePaymentUsage(
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

    @DeleteMapping("/{paymentUsageId}")
    public ResponseEntity<Void>
    deletePaymentUsage(
            @PathVariable UUID paymentUsageId
    ) {

        paymentUsageService.deletePaymentUsage(
                paymentUsageId
        );

        return ResponseEntity.noContent().build();
    }
}