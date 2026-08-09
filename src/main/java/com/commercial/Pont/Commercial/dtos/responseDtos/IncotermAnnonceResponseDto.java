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
public class IncotermAnnonceResponseDto {

    private UUID incotermId;
    private UUID annonceId;

    private UUID incotermAnnonceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}