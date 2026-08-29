package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.AnnouncementStatus;
import com.commercial.Pont.Commercial.enums.AnnouncementType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceRequestDto {

    private UUID categorieId;
    private UUID utilisateurId;
    private UUID locationOrigineId;


    private String titre;
    private String certification;
    private String description;
    private AnnouncementType type;
    private BigDecimal prix;
    private String devise;
    private Double quantite;
    private String uniteQuantite;
    private LocalDateTime dateLimite;
    private AnnouncementStatus statut;
    private Integer dureeLivraison;
    private String uniteDureeLivraison;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;


    private List<UUID> conversationIds;
    private List<UUID> documentAnnonceIds;
    private Set<UUID> annonceIncotermIds;



}