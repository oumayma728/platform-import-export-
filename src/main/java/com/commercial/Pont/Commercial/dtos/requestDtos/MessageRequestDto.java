package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequestDto {

    private UUID conversationId;
    private UUID expediteurId;

    private String contenu;
    private Boolean estLu;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateLecture;
    private Integer prixMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}