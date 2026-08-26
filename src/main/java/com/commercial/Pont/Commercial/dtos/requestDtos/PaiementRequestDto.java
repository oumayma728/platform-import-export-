package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.PaiementStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaiementRequestDto {

    private BigDecimal montant;
    private String devise;
    private String stripePaymentIntentId;
    private String stripeChargeId;
    private PaiementStatus statutPaiement;
    private LocalDateTime datePaiement;
    private String messageErreur;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}