package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleUtilisateurRequestDto {


    private UUID utilisateurId;
    private UUID roleId;

    private LocalDateTime createdAt;
}