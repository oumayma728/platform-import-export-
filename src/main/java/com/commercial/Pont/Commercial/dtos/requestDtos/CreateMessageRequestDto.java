package com.commercial.Pont.Commercial.dtos.requestDtos;

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
public class CreateMessageRequestDto {

    private UUID conversationId;

    private String contenu;
    private Boolean estLu;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateLecture;
    private Integer prixMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
