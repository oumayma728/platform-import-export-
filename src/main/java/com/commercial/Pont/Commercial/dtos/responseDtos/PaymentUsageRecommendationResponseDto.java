package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUsageRecommendationResponseDto {

    private Integer nombreMessages;

    private BigDecimal montantMessages;

    private String devise;

    private boolean abonnementRecommande;

    private UUID abonnementId;

    private String abonnementNom;

    private BigDecimal montantAbonnement;

    private String deviseAbonnement;

    private String message;
}