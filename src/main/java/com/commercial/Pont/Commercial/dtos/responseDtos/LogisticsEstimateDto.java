package com.commercial.Pont.Commercial.dtos.responseDtos;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsEstimateDto {

    private String origin;

    private String destination;

    private Double distanceKm;

    private BigDecimal estimatedCostUsd;

    private Integer estimatedDays;

    private String message;
    private String calculationType;
}