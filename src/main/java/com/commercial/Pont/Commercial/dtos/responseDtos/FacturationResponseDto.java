package com.commercial.Pont.Commercial.dtos.responseDtos;

import com.commercial.Pont.Commercial.enums.FacturationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacturationResponseDto {

    private UUID subscriptionId;
    private UUID utilisateurId;
    private UUID paymentUsageId;

    private UUID facturationId;
    private String numeroFacture;
    private Integer tva;
    private FacturationStatus statut;
    private String methodePaiement;
    private BigDecimal prixFacturation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}