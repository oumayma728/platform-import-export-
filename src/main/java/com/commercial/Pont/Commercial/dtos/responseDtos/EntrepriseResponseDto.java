package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntrepriseResponseDto {

    private UUID locationId;

    private UUID entrepriseId;
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