package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponseDto {

    private UUID locationId;
    private String pays;
    private String ville;
    private String codePostal;
    private String adresse;
    private String region;

    private List<UUID> annoncesOriginesIds;
    private List<UUID> annoncesDestinationsIds;
    private List<UUID> entreprisesIds;
}