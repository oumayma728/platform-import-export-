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
public class MessageResponseDto {

    private UUID conversationId;
    private UUID expediteurId;

    private UUID messageId;
    private String contenu;
    private Boolean estLu = false;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateLecture;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}