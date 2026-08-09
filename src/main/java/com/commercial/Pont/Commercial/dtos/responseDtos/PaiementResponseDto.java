package com.commercial.Pont.Commercial.dtos.responseDtos;

import com.commercial.Pont.Commercial.enums.PaiementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaiementResponseDto {

    private UUID facturationId;

    private UUID paiementId;
    private Double montant;
    private String devise;
    private String stripePaymentIntentId;
    private String stripeChargeId;
    private PaiementStatus statutPaiement;
    private LocalDateTime datePaiement;
    private String messageErreur;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}