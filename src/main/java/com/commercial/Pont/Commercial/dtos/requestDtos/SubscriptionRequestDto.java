package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequestDto {


    private UUID utilisateurId;
    private UUID facturationId;
    private UUID abonnementId;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

}