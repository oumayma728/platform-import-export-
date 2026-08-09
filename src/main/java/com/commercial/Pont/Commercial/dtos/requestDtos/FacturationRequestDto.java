package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.FacturationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacturationRequestDto {

    private UUID subscriptionId;
    private UUID conversationId;

    private String numeroFacture;
    private Integer tva;
    private FacturationStatus statut;
    private String methodePaiement;
    private Double prixFacturation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> paiementIds;
}