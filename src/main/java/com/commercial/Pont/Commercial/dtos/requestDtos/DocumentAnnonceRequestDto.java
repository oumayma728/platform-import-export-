package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAnnonceRequestDto {

    private UUID annonceId;

    private String nomFichier;
    private String cheminFichier;
    private String extension;
    private Long taille;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}