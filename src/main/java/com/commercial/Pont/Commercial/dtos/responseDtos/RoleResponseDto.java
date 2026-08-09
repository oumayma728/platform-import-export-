package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponseDto {

    private UUID roleId;
    private String code;
    private String nom;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Set<UUID> roleUtilisateurIds;
}