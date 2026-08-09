package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.EntrepriseMapperInterface;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.repositories.EntrepriseRepository;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.EntrepriseServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EntrepriseServiceImpl
        implements EntrepriseServiceInterface {

    private final EntrepriseRepository entrepriseRepository;

    private final EntrepriseMapperInterface entrepriseMapper;

    private final LocationRepository locationRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public EntrepriseResponseDto create(
            EntrepriseRequestDto entrepriseRequestDto
    ) {

        Entreprise entreprise =
                entrepriseMapper.requestToEntity(
                        entrepriseRequestDto
                );


        // =========================
        // Recherche de la location
        // =========================

        Location location =
                locationRepository.findById(
                                entrepriseRequestDto
                                        .getLocationId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Location non trouvée avec l'id : "
                                                + entrepriseRequestDto
                                                .getLocationId()
                                )
                        );


        // =========================
        // Association de la location
        // =========================

        entreprise.setLocation(
                location
        );


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        entreprise.setCreatedAt(
                now
        );

        entreprise.setUpdatedAt(
                now
        );


        Entreprise savedEntreprise =
                entrepriseRepository.save(
                        entreprise
                );

        return entrepriseMapper.entityToResponse(
                savedEntreprise
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public EntrepriseResponseDto update(
            UUID entrepriseId,
            EntrepriseRequestDto entrepriseRequestDto
    ) {

        Entreprise existingEntreprise =
                entrepriseRepository.findById(
                                entrepriseId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Entreprise non trouvée avec l'id : "
                                                + entrepriseId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingEntreprise.setNom(
                entrepriseRequestDto.getNom()
        );

        existingEntreprise.setSiret(
                entrepriseRequestDto.getSiret()
        );

        existingEntreprise.setNumeroTva(
                entrepriseRequestDto.getNumeroTva()
        );

        existingEntreprise.setDescription(
                entrepriseRequestDto.getDescription()
        );

        existingEntreprise.setSiteWeb(
                entrepriseRequestDto.getSiteWeb()
        );

        existingEntreprise.setLogo(
                entrepriseRequestDto.getLogo()
        );

        existingEntreprise.setAnneeCreation(
                entrepriseRequestDto.getAnneeCreation()
        );

        existingEntreprise.setCapitalSocial(
                entrepriseRequestDto.getCapitalSocial()
        );

        existingEntreprise.setChiffreAffaires(
                entrepriseRequestDto.getChiffreAffaires()
        );

        existingEntreprise.setNombreEmployes(
                entrepriseRequestDto.getNombreEmployes()
        );

        existingEntreprise.setSecteurActivite(
                entrepriseRequestDto.getSecteurActivite()
        );


        // =========================
        // Mise à jour de la location
        // =========================

        if (
                entrepriseRequestDto.getLocationId() != null
                        &&
                        !entrepriseRequestDto
                                .getLocationId()
                                .equals(
                                        existingEntreprise
                                                .getLocation()
                                                .getLocationId()
                                )
        ) {

            Location location =
                    locationRepository.findById(
                                    entrepriseRequestDto
                                            .getLocationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Location non trouvée avec l'id : "
                                                    + entrepriseRequestDto
                                                    .getLocationId()
                                    )
                            );

            existingEntreprise.setLocation(
                    location
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingEntreprise.setUpdatedAt(
                LocalDateTime.now()
        );


        Entreprise updatedEntreprise =
                entrepriseRepository.save(
                        existingEntreprise
                );

        return entrepriseMapper.entityToResponse(
                updatedEntreprise
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public EntrepriseResponseDto getById(
            UUID entrepriseId
    ) {

        Entreprise entreprise =
                entrepriseRepository.findById(
                                entrepriseId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Entreprise non trouvée avec l'id : "
                                                + entrepriseId
                                )
                        );

        return entrepriseMapper.entityToResponse(
                entreprise
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<EntrepriseResponseDto> getAll() {

        return entrepriseRepository.findAll()
                .stream()
                .map(
                        entrepriseMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID entrepriseId
    ) {

        if (
                !entrepriseRepository
                        .existsById(
                                entrepriseId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Entreprise non trouvée avec l'id : "
                            + entrepriseId
            );
        }

        entrepriseRepository.deleteById(
                entrepriseId
        );
    }
}