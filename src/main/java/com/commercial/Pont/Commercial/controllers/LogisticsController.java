package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.responseDtos.LogisticsEstimateDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.LogisticsServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/logistics")
@RequiredArgsConstructor
public class LogisticsController {

    private final LogisticsServiceInterface logisticsService;


    // =========================================
    // 1. ESTIMATION ENTRE DEUX PAYS
    // =========================================

    @GetMapping("/estimate")
    public ResponseEntity<LogisticsEstimateDto> estimateBetweenCountries(

            @RequestParam("from")
            String originCountry,

            @RequestParam("to")
            String destinationCountry

    ) {

        LogisticsEstimateDto response =
                logisticsService.calculateRoute(
                        originCountry,
                        destinationCountry
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // 2. ESTIMATION ENTRE DEUX VILLES + PAYS
    // =========================================

    @GetMapping("/estimate/cities")
    public ResponseEntity<LogisticsEstimateDto> estimateBetweenCities(

            @RequestParam("fromCity")
            String originCity,

            @RequestParam("fromCountry")
            String originCountry,

            @RequestParam("toCity")
            String destinationCity,

            @RequestParam("toCountry")
            String destinationCountry

    ) {

        LogisticsEstimateDto response =
                logisticsService.calculateRoute(
                        originCity,
                        originCountry,
                        destinationCity,
                        destinationCountry
                );

        return ResponseEntity.ok(response);
    }




    @GetMapping("/annonce/{annonceId}")
    public ResponseEntity<LogisticsEstimateDto> getLogisticsForAnnonce(
            @PathVariable UUID annonceId,
            Authentication authentication
    ) {

        LogisticsEstimateDto response =
                logisticsService.getLogistics(
                        annonceId,
                        authentication
                );

        return ResponseEntity.ok(response);
    }
}
