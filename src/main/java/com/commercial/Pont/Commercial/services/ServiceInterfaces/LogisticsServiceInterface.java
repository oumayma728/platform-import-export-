package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.responseDtos.LogisticsEstimateDto;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.UUID;

public interface LogisticsServiceInterface {

    // =========================
    // Distance entre deux pays
    // =========================
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    LogisticsEstimateDto calculateRoute(
            String originCountry,
            String destinationCountry
    );


    // =========================
    // Distance plus précise
    // Ville + Pays
    // =========================
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    LogisticsEstimateDto calculateRoute(
            String originCity,
            String originCountry,
            String destinationCity,
            String destinationCountry
    );



    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    LogisticsEstimateDto getLogistics(
            UUID annonceId,
            Authentication authentication
    );
}