package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.EntrepriseMapperInterface;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EntrepriseMapperImpl
        implements EntrepriseMapperInterface {

    private final LocationRepository locationRepository;

    private final UtilisateurRepository utilisateurRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * EntrepriseRequestDto
     *          ↓
     * Entreprise
     *
     * locationId      → Location
     * utilisateurIds  → List<Utilisateur>
     */
    @Override
    public Entreprise requestToEntity(
            EntrepriseRequestDto entrepriseRequestDto) {

        if (entrepriseRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Location
         * ========================================================
         */
        Location location = null;

        if (entrepriseRequestDto.getLocationId() != null) {

            location = locationRepository
                    .findById(
                            entrepriseRequestDto.getLocationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Utilisateurs
         * ========================================================
         */
        List<Utilisateur> utilisateurs =
                Collections.emptyList();

        if (entrepriseRequestDto.getUtilisateurIds() != null
                && !entrepriseRequestDto
                .getUtilisateurIds()
                .isEmpty()) {

            utilisateurs = utilisateurRepository.findAllById(
                    entrepriseRequestDto.getUtilisateurIds()
            );
        }


        /*
         * ========================================================
         * Construction de l'entité Entreprise
         * ========================================================
         */
        return Entreprise.builder()

                // Informations principales
                .nom(
                        entrepriseRequestDto.getNom()
                )
                .siret(
                        entrepriseRequestDto.getSiret()
                )
                .numeroTva(
                        entrepriseRequestDto.getNumeroTva()
                )
                .description(
                        entrepriseRequestDto.getDescription()
                )
                .siteWeb(
                        entrepriseRequestDto.getSiteWeb()
                )
                .logo(
                        entrepriseRequestDto.getLogo()
                )
                .anneeCreation(
                        entrepriseRequestDto.getAnneeCreation()
                )
                .capitalSocial(
                        entrepriseRequestDto.getCapitalSocial()
                )
                .chiffreAffaires(
                        entrepriseRequestDto.getChiffreAffaires()
                )
                .nombreEmployes(
                        entrepriseRequestDto.getNombreEmployes()
                )
                .secteurActivite(
                        entrepriseRequestDto.getSecteurActivite()
                )
                .createdAt(
                        entrepriseRequestDto.getCreatedAt()
                )
                .updatedAt(
                        entrepriseRequestDto.getUpdatedAt()
                )

                // Relations
                .location(location)
                .utilisateurs(utilisateurs)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Entreprise
     *      ↓
     * EntrepriseRequestDto
     *
     * location       → locationId
     * utilisateurs   → utilisateurIds
     */
    @Override
    public EntrepriseRequestDto entityToRequest(
            Entreprise entreprise) {

        if (entreprise == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Location
         * ========================================================
         */
        UUID locationId = null;

        if (entreprise.getLocation() != null) {

            locationId = entreprise
                    .getLocation()
                    .getLocationId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Utilisateurs
         * ========================================================
         */
        List<UUID> utilisateurIds =
                Collections.emptyList();

        if (entreprise.getUtilisateurs() != null) {

            utilisateurIds = entreprise
                    .getUtilisateurs()
                    .stream()
                    .map(Utilisateur::getUtilisateurId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return EntrepriseRequestDto.builder()

                // ID de la Location
                .locationId(locationId)

                // Informations principales
                .nom(
                        entreprise.getNom()
                )
                .siret(
                        entreprise.getSiret()
                )
                .numeroTva(
                        entreprise.getNumeroTva()
                )
                .description(
                        entreprise.getDescription()
                )
                .siteWeb(
                        entreprise.getSiteWeb()
                )
                .logo(
                        entreprise.getLogo()
                )
                .anneeCreation(
                        entreprise.getAnneeCreation()
                )
                .capitalSocial(
                        entreprise.getCapitalSocial()
                )
                .chiffreAffaires(
                        entreprise.getChiffreAffaires()
                )
                .nombreEmployes(
                        entreprise.getNombreEmployes()
                )
                .secteurActivite(
                        entreprise.getSecteurActivite()
                )
                .createdAt(
                        entreprise.getCreatedAt()
                )
                .updatedAt(
                        entreprise.getUpdatedAt()
                )

                // IDs des utilisateurs
                .utilisateurIds(utilisateurIds)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Entreprise
     *      ↓
     * EntrepriseResponseDto
     *
     * location       → locationId
     * utilisateurs   → utilisateurIds
     */
    @Override
    public EntrepriseResponseDto entityToResponse(
            Entreprise entreprise) {

        if (entreprise == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Location
         * ========================================================
         */
        UUID locationId = null;

        if (entreprise.getLocation() != null) {

            locationId = entreprise
                    .getLocation()
                    .getLocationId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Utilisateurs
         * ========================================================
         */
        List<UUID> utilisateurIds =
                Collections.emptyList();

        if (entreprise.getUtilisateurs() != null) {

            utilisateurIds = entreprise
                    .getUtilisateurs()
                    .stream()
                    .map(Utilisateur::getUtilisateurId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return EntrepriseResponseDto.builder()

                // ID de la Location
                .locationId(locationId)

                // ID de l'Entreprise
                .entrepriseId(
                        entreprise.getEntrepriseId()
                )

                // Informations principales
                .nom(
                        entreprise.getNom()
                )
                .siret(
                        entreprise.getSiret()
                )
                .numeroTva(
                        entreprise.getNumeroTva()
                )
                .description(
                        entreprise.getDescription()
                )
                .siteWeb(
                        entreprise.getSiteWeb()
                )
                .logo(
                        entreprise.getLogo()
                )
                .anneeCreation(
                        entreprise.getAnneeCreation()
                )
                .capitalSocial(
                        entreprise.getCapitalSocial()
                )
                .chiffreAffaires(
                        entreprise.getChiffreAffaires()
                )
                .nombreEmployes(
                        entreprise.getNombreEmployes()
                )
                .secteurActivite(
                        entreprise.getSecteurActivite()
                )
                .createdAt(
                        entreprise.getCreatedAt()
                )
                .updatedAt(
                        entreprise.getUpdatedAt()
                )

                // IDs des utilisateurs
                .utilisateurIds(utilisateurIds)

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * EntrepriseResponseDto
     *          ↓
     * Entreprise
     *
     * locationId      → Location
     * utilisateurIds  → List<Utilisateur>
     */
    @Override
    public Entreprise responseToEntity(
            EntrepriseResponseDto entrepriseResponseDto) {

        if (entrepriseResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Location
         * ========================================================
         */
        Location location = null;

        if (entrepriseResponseDto.getLocationId() != null) {

            location = locationRepository
                    .findById(
                            entrepriseResponseDto.getLocationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Utilisateurs
         * ========================================================
         */
        List<Utilisateur> utilisateurs =
                Collections.emptyList();

        if (entrepriseResponseDto.getUtilisateurIds() != null
                && !entrepriseResponseDto
                .getUtilisateurIds()
                .isEmpty()) {

            utilisateurs = utilisateurRepository.findAllById(
                    entrepriseResponseDto.getUtilisateurIds()
            );
        }


        /*
         * ========================================================
         * Construction de l'entité Entreprise
         * ========================================================
         */
        return Entreprise.builder()

                // ID de l'Entreprise
                .entrepriseId(
                        entrepriseResponseDto
                                .getEntrepriseId()
                )

                // Informations principales
                .nom(
                        entrepriseResponseDto.getNom()
                )
                .siret(
                        entrepriseResponseDto.getSiret()
                )
                .numeroTva(
                        entrepriseResponseDto.getNumeroTva()
                )
                .description(
                        entrepriseResponseDto.getDescription()
                )
                .siteWeb(
                        entrepriseResponseDto.getSiteWeb()
                )
                .logo(
                        entrepriseResponseDto.getLogo()
                )
                .anneeCreation(
                        entrepriseResponseDto.getAnneeCreation()
                )
                .capitalSocial(
                        entrepriseResponseDto.getCapitalSocial()
                )
                .chiffreAffaires(
                        entrepriseResponseDto.getChiffreAffaires()
                )
                .nombreEmployes(
                        entrepriseResponseDto.getNombreEmployes()
                )
                .secteurActivite(
                        entrepriseResponseDto.getSecteurActivite()
                )
                .createdAt(
                        entrepriseResponseDto.getCreatedAt()
                )
                .updatedAt(
                        entrepriseResponseDto.getUpdatedAt()
                )

                // Relations
                .location(location)
                .utilisateurs(utilisateurs)

                .build();
    }
}
