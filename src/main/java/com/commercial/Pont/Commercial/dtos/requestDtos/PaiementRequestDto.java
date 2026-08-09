package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.PaiementStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaiementRequestDto {

    private UUID facturationId;

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