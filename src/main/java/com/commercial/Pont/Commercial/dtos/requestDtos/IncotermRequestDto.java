package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncotermRequestDto {

    private String code;
    private String nom;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Set<UUID> incotermAnnonceIds;
}