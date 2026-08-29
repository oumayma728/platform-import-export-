package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.responseDtos.CoordinatesDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LogisticsEstimateDto;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.LogisticsServiceInterface;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;


import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LogisticsServiceImpl
        implements LogisticsServiceInterface {

    @Value("${logistics.api-key}")
    private String apiKey;

    @Value("${logistics.api-url}")
    private String apiUrl;

    @Value("${logistics.cost-per-km-usd}")
    private BigDecimal costPerKmUsd;

    @Value("${logistics.estimated-km-per-day}")
    private double estimatedKmPerDay;

    private final RestClient.Builder restClientBuilder;

    private final AnnonceRepository annonceRepository;

    private final UtilisateurRepository utilisateurRepository;

    // ========================================
    // 1. CALCUL ENTRE DEUX PAYS
    // ========================================

    @Override
    public LogisticsEstimateDto calculateRoute(
            String originCountry,
            String destinationCountry
    ) {

        CoordinatesDto originCoordinates =
                getCoordinates(originCountry);

        CoordinatesDto destinationCoordinates =
                getCoordinates(destinationCountry);

        double distanceKm =
                calculateHaversineDistance(
                        originCoordinates,
                        destinationCoordinates
                );

        BigDecimal estimatedCost =
                calculateEstimatedCost(distanceKm);

        int estimatedDays =
                calculateEstimatedDays(distanceKm);

        return LogisticsEstimateDto.builder()
                .origin(originCountry)
                .destination(destinationCountry)
                .distanceKm(distanceKm)
                .estimatedCostUsd(estimatedCost)
                .estimatedDays(estimatedDays)
                .calculationType("GEOGRAPHIC_ESTIMATE")
                .message(
                        "Estimation géographique entre les deux pays."
                )
                .build();
    }


    // ========================================
    // 2. CALCUL ENTRE DEUX VILLES + PAYS
    // ========================================

    @Override
    public LogisticsEstimateDto calculateRoute(
            String originCity,
            String originCountry,
            String destinationCity,
            String destinationCountry
    ) {

        String origin =
                buildLocationQuery(
                        originCity,
                        originCountry
                );

        String destination =
                buildLocationQuery(
                        destinationCity,
                        destinationCountry
                );

        return calculateRouteInternal(
                origin,
                destination
        );
    }


    // ========================================
    // CONSTRUIRE LA LOCATION
    // ========================================

    private String buildLocationQuery(
            String city,
            String country
    ) {

        if (city == null || city.isBlank()) {

            return country;
        }

        return city.trim()
                + ", "
                + country.trim();
    }


    // ========================================
    // LOGIQUE COMMUNE
    // ========================================

    private LogisticsEstimateDto calculateRouteInternal(
            String origin,
            String destination
    ) {

        CoordinatesDto originCoordinates =
                getCoordinates(origin);

        CoordinatesDto destinationCoordinates =
                getCoordinates(destination);

        double distanceKm;

        String calculationType;

        String message;

        try {

            // =========================================
            // Essayer vraie distance routière ORS
            // =========================================

            distanceKm =
                    getDistance(
                            originCoordinates,
                            destinationCoordinates
                    );

            calculationType = "ROAD";

            message =
                    "Distance routière calculée avec succès.";

        } catch (Exception e) {

            // =========================================
            // ORS impossible -> Haversine
            // =========================================

            System.out.println(
                    "Route ORS indisponible : "
                            + origin
                            + " -> "
                            + destination
            );

            System.out.println(
                    "Fallback Haversine. Cause : "
                            + e.getMessage()
            );

            distanceKm =
                    calculateHaversineDistance(
                            originCoordinates,
                            destinationCoordinates
                    );

            calculationType =
                    "GEOGRAPHIC_ESTIMATE";

            message =
                    "Route routière indisponible. "
                            + "Estimation géographique utilisée.";
        }


        BigDecimal estimatedCost =
                calculateEstimatedCost(
                        distanceKm
                );

        int estimatedDays =
                calculateEstimatedDays(
                        distanceKm
                );


        return LogisticsEstimateDto.builder()
                .origin(origin)
                .destination(destination)
                .distanceKm(distanceKm)
                .estimatedCostUsd(estimatedCost)
                .estimatedDays(estimatedDays)
                .message(message)
                .calculationType(calculationType)
                .build();
    }


    // ========================================
    // GEOCODING
    // ========================================

    @SuppressWarnings("unchecked")
    private CoordinatesDto getCoordinates(String location) {

        if (location == null || location.isBlank()) {
            throw new IllegalArgumentException(
                    "La localisation ne peut pas être vide."
            );
        }

        try {

            RestClient restClient =
                    restClientBuilder
                            .baseUrl(apiUrl)
                            .build();

            Map<String, Object> response =
                    restClient
                            .get()
                            .uri(uriBuilder ->
                                    uriBuilder
                                            .path("/pelias/v1/search")
                                            .queryParam("api_key", apiKey)
                                            .queryParam("text", location)
                                            .queryParam("size", 1)
                                            .build()
                            )
                            .retrieve()
                            .body(Map.class);

            if (response == null) {
                throw new IllegalStateException(
                        "Réponse vide du service de géocodage."
                );
            }

            List<Map<String, Object>> features =
                    (List<Map<String, Object>>)
                            response.get("features");

            if (features == null || features.isEmpty()) {

                throw new IllegalArgumentException(
                        "Localisation introuvable : " + location
                );
            }

            Map<String, Object> firstFeature =
                    features.get(0);

            Map<String, Object> geometry =
                    (Map<String, Object>)
                            firstFeature.get("geometry");

            if (geometry == null) {
                throw new IllegalStateException(
                        "Coordonnées introuvables pour : "
                                + location
                );
            }

            List<Number> coordinates =
                    (List<Number>)
                            geometry.get("coordinates");

            if (coordinates == null ||
                    coordinates.size() < 2) {

                throw new IllegalStateException(
                        "Coordonnées invalides pour : "
                                + location
                );
            }

            double longitude =
                    coordinates.get(0).doubleValue();

            double latitude =
                    coordinates.get(1).doubleValue();

            System.out.println(
                    "Location : " + location
                            + " | longitude : " + longitude
                            + " | latitude : " + latitude
            );

            return new CoordinatesDto(
                    longitude,
                    latitude
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Erreur lors du géocodage de "
                            + location
                            + " : "
                            + e.getMessage(),
                    e
            );
        }
    }


    // ========================================
    // ROUTING
    // ========================================

    @SuppressWarnings("unchecked")
    private double getDistance(
            CoordinatesDto origin,
            CoordinatesDto destination
    ) {

        if (origin == null ||
                destination == null) {

            throw new IllegalArgumentException(
                    "Les coordonnées origine et destination sont obligatoires."
            );
        }

        try {

            RestClient restClient =
                    restClientBuilder
                            .baseUrl(apiUrl)
                            .build();

            String start =
                    origin.getLongitude()
                            + ","
                            + origin.getLatitude();

            String end =
                    destination.getLongitude()
                            + ","
                            + destination.getLatitude();

            Map<String, Object> response =
                    restClient
                            .get()
                            .uri(uriBuilder ->
                                    uriBuilder
                                            .path("/openrouteservice/v2/directions/driving-hgv")
                                            .queryParam(
                                                    "api_key",
                                                    apiKey
                                            )
                                            .queryParam(
                                                    "start",
                                                    start
                                            )
                                            .queryParam(
                                                    "end",
                                                    end
                                            )
                                            .build()
                            )
                            .retrieve()
                            .body(Map.class);

            if (response == null) {

                throw new IllegalStateException(
                        "Réponse vide du service de routage."
                );
            }

            List<Map<String, Object>> features =
                    (List<Map<String, Object>>)
                            response.get("features");

            if (features == null ||
                    features.isEmpty()) {

                throw new IllegalStateException(
                        "Aucune route trouvée entre "
                                + start
                                + " et "
                                + end
                );
            }

            Map<String, Object> feature =
                    features.get(0);

            Map<String, Object> properties =
                    (Map<String, Object>)
                            feature.get("properties");

            if (properties == null) {

                throw new IllegalStateException(
                        "Propriétés de la route absentes."
                );
            }

            Map<String, Object> summary =
                    (Map<String, Object>)
                            properties.get("summary");

            if (summary == null) {

                throw new IllegalStateException(
                        "Résumé de la route absent."
                );
            }

            Number distanceMeters =
                    (Number)
                            summary.get("distance");

            if (distanceMeters == null) {

                throw new IllegalStateException(
                        "Distance absente de la réponse."
                );
            }

            // ORS retourne la distance en mètres
            double distanceKm =
                    distanceMeters.doubleValue()
                            / 1000.0;

            // Arrondi à 2 décimales
            return Math.round(
                    distanceKm * 100.0
            ) / 100.0;

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Erreur pendant le calcul de distance : "
                            + e.getMessage(),
                    e
            );
        }
    }


    // ========================================
    // ESTIMATION DU COÛT
    // ========================================

    private BigDecimal calculateEstimatedCost(
            double distanceKm
    ) {

        return BigDecimal
                .valueOf(distanceKm)
                .multiply(costPerKmUsd)
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }


    // ========================================
    // ESTIMATION DU DÉLAI
    // ========================================

    private int calculateEstimatedDays(
            double distanceKm
    ) {

        return Math.max(
                1,
                (int) Math.ceil(
                        distanceKm / estimatedKmPerDay
                )
        );
    }



    private double calculateHaversineDistance(
            CoordinatesDto origin,
            CoordinatesDto destination
    ) {

        final double EARTH_RADIUS_KM = 6371.0;

        double lat1 =
                Math.toRadians(
                        origin.getLatitude()
                );

        double lon1 =
                Math.toRadians(
                        origin.getLongitude()
                );

        double lat2 =
                Math.toRadians(
                        destination.getLatitude()
                );

        double lon2 =
                Math.toRadians(
                        destination.getLongitude()
                );

        double deltaLat =
                lat2 - lat1;

        double deltaLon =
                lon2 - lon1;

        double a =
                Math.sin(deltaLat / 2)
                        * Math.sin(deltaLat / 2)
                        +
                        Math.cos(lat1)
                                * Math.cos(lat2)
                                *
                                Math.sin(deltaLon / 2)
                                * Math.sin(deltaLon / 2);

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        double distance =
                EARTH_RADIUS_KM * c;

        return Math.round(
                distance * 100.0
        ) / 100.0;
    }








    @Override
    public LogisticsEstimateDto getLogistics(
            UUID annonceId,
            Authentication authentication
    ) {

        // =========================================
        // 1. Vérifier l'authentification
        // =========================================

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "Utilisateur non authentifié."
            );
        }


        // =========================================
        // 2. Récupérer l'annonce
        // =========================================

        Annonce annonce =
                annonceRepository
                        .findById(annonceId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Annonce introuvable : "
                                                + annonceId
                                )
                        );


        // =========================================
        // 3. Vérifier location de l'annonce
        // =========================================

        Location origin =
                annonce.getLocationOrigine();

        if (origin == null) {

            throw new IllegalStateException(
                    "L'annonce ne possède pas de localisation d'origine."
            );
        }


        // =========================================
        // 4. Récupérer utilisateur connecté
        // =========================================

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(
                                () -> new IllegalStateException(
                                        "Utilisateur connecté introuvable."
                                )
                        );

        if (annonce.getUtilisateur() != null
                && annonce.getUtilisateur()
                .getUtilisateurId()
                .equals(utilisateur.getUtilisateurId())) {

            return LogisticsEstimateDto.builder()
                    .origin(
                            buildLocationLabel(origin)
                    )
                    .destination(
                            buildLocationLabel(origin)
                    )
                    .distanceKm(0.0)
                    .estimatedCostUsd(BigDecimal.ZERO)
                    .estimatedDays(0)
                    .message("C'est votre annonce.")
                    .calculationType("OWN_ANNOUNCEMENT")
                    .build();
        }

        // =========================================
        // 5. Récupérer location entreprise
        // =========================================

        if (utilisateur.getEntreprise() == null) {

            throw new IllegalStateException(
                    "L'utilisateur n'est associé à aucune entreprise."
            );
        }

        Location destination =
                utilisateur
                        .getEntreprise()
                        .getLocation();

        if (destination == null) {

            throw new IllegalStateException(
                    "L'entreprise de l'utilisateur ne possède pas de localisation."
            );
        }


        // =========================================
        // 6. Vérifier les pays
        // =========================================

        if (origin.getPays() == null
                || origin.getPays().isBlank()) {

            throw new IllegalStateException(
                    "Le pays d'origine de l'annonce est absent."
            );
        }

        if (destination.getPays() == null
                || destination.getPays().isBlank()) {

            throw new IllegalStateException(
                    "Le pays de destination est absent."
            );
        }




        if (origin.getLocationId() != null
                && origin.getLocationId()
                .equals(destination.getLocationId())) {

            return LogisticsEstimateDto.builder()
                    .origin(
                            buildLocationLabel(origin)
                    )
                    .destination(
                            buildLocationLabel(destination)
                    )
                    .distanceKm(0.0)
                    .estimatedCostUsd(BigDecimal.ZERO)
                    .estimatedDays(0)
                    .message("Même localisation.")
                    .calculationType("SAME_LOCATION")
                    .build();
        }


// =========================================
// MÊME VILLE + MÊME PAYS
// =========================================

        boolean sameCountry =
                origin.getPays() != null
                        && destination.getPays() != null
                        && origin.getPays()
                        .trim()
                        .equalsIgnoreCase(
                                destination.getPays().trim()
                        );

        boolean sameCity =
                origin.getVille() != null
                        && destination.getVille() != null
                        && !origin.getVille().isBlank()
                        && !destination.getVille().isBlank()
                        && origin.getVille()
                        .trim()
                        .equalsIgnoreCase(
                                destination.getVille().trim()
                        );

        if (sameCountry && sameCity) {

            return LogisticsEstimateDto.builder()
                    .origin(
                            buildLocationLabel(origin)
                    )
                    .destination(
                            buildLocationLabel(destination)
                    )
                    .distanceKm(0.0)
                    .estimatedCostUsd(BigDecimal.ZERO)
                    .estimatedDays(0)
                    .message("Même localisation.")
                    .calculationType("SAME_LOCATION")
                    .build();
        }
        // =========================================
        // 7. Si les villes existent
        // => calcul précis avec ORS
        // =========================================

        boolean originCityAvailable =
                origin.getVille() != null
                        && !origin.getVille().isBlank();

        boolean destinationCityAvailable =
                destination.getVille() != null
                        && !destination.getVille().isBlank();


        if (originCityAvailable
                && destinationCityAvailable) {

            return calculateRoute(
                    origin.getVille(),
                    origin.getPays(),
                    destination.getVille(),
                    destination.getPays()
            );
        }


        // =========================================
        // 8. Sinon fallback pays -> pays
        // =========================================

        return calculateRoute(
                origin.getPays(),
                destination.getPays()
        );
    }




    private String buildLocationLabel(
            Location location
    ) {

        if (location == null) {
            return null;
        }

        boolean cityAvailable =
                location.getVille() != null
                        && !location.getVille().isBlank();

        boolean countryAvailable =
                location.getPays() != null
                        && !location.getPays().isBlank();

        if (cityAvailable && countryAvailable) {

            return location.getVille().trim()
                    + ", "
                    + location.getPays().trim();
        }

        if (cityAvailable) {
            return location.getVille().trim();
        }

        if (countryAvailable) {
            return location.getPays().trim();
        }

        return null;
    }
}