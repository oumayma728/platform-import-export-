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
public class DocumentConversationResponseDto {

    private UUID utilisateurId;
    private UUID conversationId;

    private UUID documentConversationId;
    private String nomFichier;
    private String cheminFichier;
    private String extension;
    private Long taille;
    private Boolean estLu;
    private LocalDateTime dateLecture;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}