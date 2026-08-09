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
public class CategorieRequestDto {

    private String nom;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> annonceIds;
}