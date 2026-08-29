package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.responseDtos.LogisticsEstimateDto;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public interface LogisticsServiceInterface {

    // =========================
    // Distance entre deux pays
    // =========================
    LogisticsEstimateDto calculateRoute(
            String originCountry,
            String destinationCountry
    );


    // =========================
    // Distance plus précise
    // Ville + Pays
    // =========================
    LogisticsEstimateDto calculateRoute(
            String originCity,
            String originCountry,
            String destinationCity,
            String destinationCountry
    );



    LogisticsEstimateDto getLogistics(
            UUID annonceId,
            Authentication authentication
    );
}