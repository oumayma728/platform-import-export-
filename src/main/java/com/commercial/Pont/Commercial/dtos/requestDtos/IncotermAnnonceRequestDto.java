package com.commercial.Pont.Commercial.dtos.requestDtos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncotermAnnonceRequestDto {

    private UUID incotermId;
    private UUID annonceId;

    private UUID incotermAnnonceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}