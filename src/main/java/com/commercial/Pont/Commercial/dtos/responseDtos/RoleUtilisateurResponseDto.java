package com.commercial.Pont.Commercial.dtos.responseDtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleUtilisateurResponseDto {


    private UUID utilisateurId;
    private UUID roleId;

    private UUID roleUtilisateurId;
    private LocalDateTime createdAt;
}