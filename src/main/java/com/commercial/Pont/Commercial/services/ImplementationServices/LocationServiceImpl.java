package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.LocationMapperInterface;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.LocationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class LocationServiceImpl implements LocationServiceInterface {

    private final LocationRepository locationRepository;

    private final LocationMapperInterface locationMapper;


// =========================================================
// CREATE
// =========================================================

    @Override
    public LocationResponseDto create(
            LocationRequestDto locationRequestDto
    ) {

        // Vérification du DTO
        if (locationRequestDto == null) {
            throw new IllegalArgumentException(
                    "Les données de la location sont obligatoires"
            );
        }

        // Conversion DTO -> Entity
        Location location =
                locationMapper.requestToEntity(
                        locationRequestDto
                );

        // Sauvegarde
        Location savedLocation =
                locationRepository.save(
                        location
                );

        // Conversion Entity -> Response DTO
        return locationMapper.entityToResponse(
                savedLocation
        );
    }


// =========================================================
// UPDATE
// =========================================================

    @Override
    public LocationResponseDto update(
            UUID locationId,
            LocationRequestDto locationRequestDto
    ) {

        // Vérification de l'ID
        if (locationId == null) {
            throw new IllegalArgumentException(
                    "L'identifiant de la location est obligatoire"
            );
        }

        // Vérification du DTO
        if (locationRequestDto == null) {
            throw new IllegalArgumentException(
                    "Les données de la location sont obligatoires"
            );
        }

        // Recherche de la location existante
        Location existingLocation =
                locationRepository.findById(
                                locationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Location non trouvée avec l'id : "
                                                + locationId
                                )
                        );


        // =====================================================
        // Mise à jour des informations de la location
        // =====================================================

        existingLocation.setPays(
                locationRequestDto.getPays()
        );

        existingLocation.setVille(
                locationRequestDto.getVille()
        );

        existingLocation.setCodePostal(
                locationRequestDto.getCodePostal()
        );

        existingLocation.setAdresse(
                locationRequestDto.getAdresse()
        );

        existingLocation.setRegion(
                locationRequestDto.getRegion()
        );


        // =====================================================
        // Sauvegarde
        // =====================================================

        Location updatedLocation =
                locationRepository.save(
                        existingLocation
                );


        // =====================================================
        // Conversion Entity -> Response DTO
        // =====================================================

        return locationMapper.entityToResponse(
                updatedLocation
        );
    }


// =========================================================
// GET BY ID
// =========================================================

    @Override
    @Transactional(readOnly = true)
    public LocationResponseDto getById(
            UUID locationId
    ) {

        // Vérification de l'ID
        if (locationId == null) {
            throw new IllegalArgumentException(
                    "L'identifiant de la location est obligatoire"
            );
        }

        // Recherche
        Location location =
                locationRepository.findById(
                                locationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Location non trouvée avec l'id : "
                                                + locationId
                                )
                        );

        // Conversion Entity -> Response DTO
        return locationMapper.entityToResponse(
                location
        );
    }


// =========================================================
// GET ALL
// =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<LocationResponseDto> getAll() {

        return locationRepository.findAll()
                .stream()
                .map(locationMapper::entityToResponse)
                .toList();
    }


// =========================================================
// DELETE
// =========================================================

    @Override
    public void delete(
            UUID locationId
    ) {

        // Vérification de l'ID
        if (locationId == null) {
            throw new IllegalArgumentException(
                    "L'identifiant de la location est obligatoire"
            );
        }

        // Vérification de l'existence
        Location location =
                locationRepository.findById(
                                locationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Location non trouvée avec l'id : "
                                                + locationId
                                )
                        );

        // Suppression
        locationRepository.delete(
                location
        );
    }

}
