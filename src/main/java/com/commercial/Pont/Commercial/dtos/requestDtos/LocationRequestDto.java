package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequestDto {

    private String pays;
    private String ville;
    private String codePostal;
    private String adresse;
    private String region;

    private List<UUID> annoncesOriginesIds;
    private List<UUID> annoncesDestinationsIds;
    private List<UUID> entreprisesIds;
}