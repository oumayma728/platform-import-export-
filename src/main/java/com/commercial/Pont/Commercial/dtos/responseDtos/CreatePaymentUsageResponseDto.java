package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentUsageResponseDto {

    private UUID paiementId;

    private Integer nombreMessagesAchetes;

    /*
     * Montant dans l'unité Stripe.
     *
     * Exemple :
     * 150 MAD → 15000
     */
    private Long montant;

    private BigDecimal montantDecimal;

    private String devise;

    private String paymentIntentId;

    private String clientSecret;

    private String statut;
}