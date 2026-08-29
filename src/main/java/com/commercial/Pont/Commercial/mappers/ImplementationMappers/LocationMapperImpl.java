package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.LocationMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.EntrepriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LocationMapperImpl
        implements LocationMapperInterface {

    private final AnnonceRepository annonceRepository;

    private final EntrepriseRepository entrepriseRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * LocationRequestDto
     *          ↓
     * Location
     *
     * annoncesOriginesIds     → List<Annonce>
     * entreprisesIds          → List<Entreprise>
     */
    @Override
    public Location requestToEntity(
            LocationRequestDto locationRequestDto) {

        if (locationRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération des annonces d'origine
         * ========================================================
         */
        List<Annonce> annoncesOrigines =
                Collections.emptyList();

        if (locationRequestDto.getAnnoncesOriginesIds() != null
                && !locationRequestDto
                .getAnnoncesOriginesIds()
                .isEmpty()) {

            annoncesOrigines = annonceRepository.findAllById(
                    locationRequestDto.getAnnoncesOriginesIds()
            );
        }





        /*
         * ========================================================
         * Récupération des entreprises
         * ========================================================
         */
        List<Entreprise> entreprises =
                Collections.emptyList();

        if (locationRequestDto.getEntreprisesIds() != null
                && !locationRequestDto
                .getEntreprisesIds()
                .isEmpty()) {

            entreprises = entrepriseRepository.findAllById(
                    locationRequestDto.getEntreprisesIds()
            );
        }


        /*
         * ========================================================
         * Construction de l'entité Location
         * ========================================================
         */
        return Location.builder()

                // Informations principales
                .pays(
                        locationRequestDto.getPays()
                )
                .ville(
                        locationRequestDto.getVille()
                )
                .codePostal(
                        locationRequestDto.getCodePostal()
                )
                .adresse(
                        locationRequestDto.getAdresse()
                )
                .region(
                        locationRequestDto.getRegion()
                )

                // Relations
                .annoncesOrigines(annoncesOrigines)
                .entreprises(entreprises)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Location
     *      ↓
     * LocationRequestDto
     *
     * annoncesOrigines     → annoncesOriginesIds
     * entreprises          → entreprisesIds
     */
    @Override
    public LocationRequestDto entityToRequest(
            Location location) {

        if (location == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction des IDs des annonces d'origine
         * ========================================================
         */
        List<UUID> annoncesOriginesIds =
                Collections.emptyList();

        if (location.getAnnoncesOrigines() != null) {

            annoncesOriginesIds = location
                    .getAnnoncesOrigines()
                    .stream()
                    .map(Annonce::getAnnonceId)
                    .collect(Collectors.toList());
        }
        /*
         * ========================================================
         * Extraction des IDs des entreprises
         * ========================================================
         */
        List<UUID> entreprisesIds =
                Collections.emptyList();

        if (location.getEntreprises() != null) {

            entreprisesIds = location
                    .getEntreprises()
                    .stream()
                    .map(Entreprise::getEntrepriseId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return LocationRequestDto.builder()

                // Informations principales
                .pays(
                        location.getPays()
                )
                .ville(
                        location.getVille()
                )
                .codePostal(
                        location.getCodePostal()
                )
                .adresse(
                        location.getAdresse()
                )
                .region(
                        location.getRegion()
                )

                // IDs des relations
                .annoncesOriginesIds(
                        annoncesOriginesIds
                )
                .entreprisesIds(
                        entreprisesIds
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Location
     *      ↓
     * LocationResponseDto
     *
     * annoncesOrigines     → annoncesOriginesIds
     * entreprises          → entreprisesIds
     */
    @Override
    public LocationResponseDto entityToResponse(
            Location location) {

        if (location == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction des IDs des annonces d'origine
         * ========================================================
         */
        List<UUID> annoncesOriginesIds =
                Collections.emptyList();

        if (location.getAnnoncesOrigines() != null) {

            annoncesOriginesIds = location
                    .getAnnoncesOrigines()
                    .stream()
                    .map(Annonce::getAnnonceId)
                    .collect(Collectors.toList());
        }



        /*
         * ========================================================
         * Extraction des IDs des entreprises
         * ========================================================
         */
        List<UUID> entreprisesIds =
                Collections.emptyList();

        if (location.getEntreprises() != null) {

            entreprisesIds = location
                    .getEntreprises()
                    .stream()
                    .map(Entreprise::getEntrepriseId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return LocationResponseDto.builder()

                // ID de la Location
                .locationId(
                        location.getLocationId()
                )

                // Informations principales
                .pays(
                        location.getPays()
                )
                .ville(
                        location.getVille()
                )
                .codePostal(
                        location.getCodePostal()
                )
                .adresse(
                        location.getAdresse()
                )
                .region(
                        location.getRegion()
                )

                // IDs des relations
                .annoncesOriginesIds(
                        annoncesOriginesIds
                )

                .entreprisesIds(
                        entreprisesIds
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * LocationResponseDto
     *          ↓
     * Location
     *
     * annoncesOriginesIds     → List<Annonce>
     * entreprisesIds          → List<Entreprise>
     */
    @Override
    public Location responseToEntity(
            LocationResponseDto locationResponseDto) {

        if (locationResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération des annonces d'origine
         * ========================================================
         */
        List<Annonce> annoncesOrigines =
                Collections.emptyList();

        if (locationResponseDto.getAnnoncesOriginesIds() != null
                && !locationResponseDto
                .getAnnoncesOriginesIds()
                .isEmpty()) {

            annoncesOrigines = annonceRepository.findAllById(
                    locationResponseDto
                            .getAnnoncesOriginesIds()
            );
        }



        /*
         * ========================================================
         * Récupération des entreprises
         * ========================================================
         */
        List<Entreprise> entreprises =
                Collections.emptyList();

        if (locationResponseDto.getEntreprisesIds() != null
                && !locationResponseDto
                .getEntreprisesIds()
                .isEmpty()) {

            entreprises = entrepriseRepository.findAllById(
                    locationResponseDto
                            .getEntreprisesIds()
            );
        }


        /*
         * ========================================================
         * Construction de l'entité Location
         * ========================================================
         */
        return Location.builder()

                // ID de la Location
                .locationId(
                        locationResponseDto.getLocationId()
                )

                // Informations principales
                .pays(
                        locationResponseDto.getPays()
                )
                .ville(
                        locationResponseDto.getVille()
                )
                .codePostal(
                        locationResponseDto.getCodePostal()
                )
                .adresse(
                        locationResponseDto.getAdresse()
                )
                .region(
                        locationResponseDto.getRegion()
                )

                // Relations
                .annoncesOrigines(annoncesOrigines)
                .entreprises(entreprises)

                .build();
    }
}
