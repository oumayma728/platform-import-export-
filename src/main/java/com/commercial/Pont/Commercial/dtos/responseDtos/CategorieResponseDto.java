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
public class CategorieResponseDto {

    private UUID categorieId;
    private String nom;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> annonceIds;
}