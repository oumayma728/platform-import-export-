package com.commercial.Pont.Commercial.dtos.responseDtos;


import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.enums.AbonnementType;
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
public class AbonnementResponseDto {

    private UUID abonnementId;
    private String nom;
    private AbonnementType typeAbonnement;
    private Integer dureeEnMois;
    private BigDecimal montant;
    private String devise;
    private AbonnementStatus statut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> subscriptionIds;
}