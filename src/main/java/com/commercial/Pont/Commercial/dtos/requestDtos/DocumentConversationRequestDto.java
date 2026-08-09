package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentConversationRequestDto {

    private UUID utilisateurId;
    private UUID conversationId;

    private String nomFichier;
    private String cheminFichier;
    private String extension;
    private Long taille;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}