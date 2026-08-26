package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSubscriptionResponseDto {

    private UUID paiementId;

    private UUID abonnementId;

    private String paymentIntentId;

    private String clientSecret;

    private Long montant;

    private String devise;

    private String statut;
}