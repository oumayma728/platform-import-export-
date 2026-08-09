package com.commercial.Pont.Commercial.dtos.responseDtos;

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
public class SubscriptionResponseDto {


    private UUID utilisateurId;
    private UUID facturationId;
    private UUID abonnementId;

    private UUID subscriptionId;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

}