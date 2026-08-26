package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUsageResponseDto {

    private UUID paymentUsageId;

    private UUID utilisateurId;

    private UUID paiementId;

    private UUID facturationId;

    private Integer nombreMessagesAchetes;

    private BigDecimal montant;

    private String devise;

    private LocalDateTime dateAchat;

    private LocalDateTime dateExpiration;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}