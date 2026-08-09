package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntrepriseRequestDto {

    private UUID locationId;

    private String nom;
    private String siret;
    private String numeroTva;
    private String description;
    private String siteWeb;
    private String logo;
    private Integer anneeCreation;
    private Double capitalSocial;
    private Double chiffreAffaires;
    private Integer nombreEmployes;
    private String secteurActivite;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> utilisateurIds;

}