package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.IncotermAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermAnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.IncotermAnnonceServiceInterface;
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
public class IncotermAnnonceServiceImpl
        implements IncotermAnnonceServiceInterface {

    private final IncotermAnnonceRepository incotermAnnonceRepository;

    private final IncotermAnnonceMapperInterface incotermAnnonceMapper;

    private final IncotermRepository incotermRepository;

    private final AnnonceRepository annonceRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public IncotermAnnonceResponseDto create(
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    ) {

        IncotermAnnonce incotermAnnonce =
                incotermAnnonceMapper.requestToEntity(
                        incotermAnnonceRequestDto
                );


        // =========================
        // Recherche de l'Incoterm
        // =========================

        Incoterm incoterm =
                incotermRepository.findById(
                                incotermAnnonceRequestDto
                                        .getIncotermId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Incoterm non trouvé avec l'id : "
                                                + incotermAnnonceRequestDto
                                                .getIncotermId()
                                )
                        );


        // =========================
        // Recherche de l'Annonce
        // =========================

        Annonce annonce =
                annonceRepository.findById(
                                incotermAnnonceRequestDto
                                        .getAnnonceId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + incotermAnnonceRequestDto
                                                .getAnnonceId()
                                )
                        );


        // =========================
        // Association des relations
        // =========================

        incotermAnnonce.setIncoterm(
                incoterm
        );

        incotermAnnonce.setAnnonce(
                annonce
        );


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        incotermAnnonce.setCreatedAt(
                now
        );

        incotermAnnonce.setUpdatedAt(
                now
        );


        IncotermAnnonce savedIncotermAnnonce =
                incotermAnnonceRepository.save(
                        incotermAnnonce
                );

        return incotermAnnonceMapper.entityToResponse(
                savedIncotermAnnonce
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public IncotermAnnonceResponseDto update(
            UUID incotermAnnonceId,
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    ) {

        IncotermAnnonce existingIncotermAnnonce =
                incotermAnnonceRepository.findById(
                                incotermAnnonceId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "IncotermAnnonce non trouvé avec l'id : "
                                                + incotermAnnonceId
                                )
                        );


        // =========================
        // Mise à jour de l'Incoterm
        // =========================

        if (
                incotermAnnonceRequestDto.getIncotermId() != null
                        &&
                        !incotermAnnonceRequestDto
                                .getIncotermId()
                                .equals(
                                        existingIncotermAnnonce
                                                .getIncoterm()
                                                .getIncotermId()
                                )
        ) {

            Incoterm incoterm =
                    incotermRepository.findById(
                                    incotermAnnonceRequestDto
                                            .getIncotermId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Incoterm non trouvé avec l'id : "
                                                    + incotermAnnonceRequestDto
                                                    .getIncotermId()
                                    )
                            );

            existingIncotermAnnonce.setIncoterm(
                    incoterm
            );
        }


        // =========================
        // Mise à jour de l'Annonce
        // =========================

        if (
                incotermAnnonceRequestDto.getAnnonceId() != null
                        &&
                        !incotermAnnonceRequestDto
                                .getAnnonceId()
                                .equals(
                                        existingIncotermAnnonce
                                                .getAnnonce()
                                                .getAnnonceId()
                                )
        ) {

            Annonce annonce =
                    annonceRepository.findById(
                                    incotermAnnonceRequestDto
                                            .getAnnonceId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Annonce non trouvée avec l'id : "
                                                    + incotermAnnonceRequestDto
                                                    .getAnnonceId()
                                    )
                            );

            existingIncotermAnnonce.setAnnonce(
                    annonce
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingIncotermAnnonce.setUpdatedAt(
                LocalDateTime.now()
        );


        IncotermAnnonce updatedIncotermAnnonce =
                incotermAnnonceRepository.save(
                        existingIncotermAnnonce
                );

        return incotermAnnonceMapper.entityToResponse(
                updatedIncotermAnnonce
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public IncotermAnnonceResponseDto getById(
            UUID incotermAnnonceId
    ) {

        IncotermAnnonce incotermAnnonce =
                incotermAnnonceRepository.findById(
                                incotermAnnonceId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "IncotermAnnonce non trouvé avec l'id : "
                                                + incotermAnnonceId
                                )
                        );

        return incotermAnnonceMapper.entityToResponse(
                incotermAnnonce
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<IncotermAnnonceResponseDto> getAll() {

        return incotermAnnonceRepository.findAll()
                .stream()
                .map(
                        incotermAnnonceMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID incotermAnnonceId
    ) {

        if (
                !incotermAnnonceRepository
                        .existsById(
                                incotermAnnonceId
                        )
        ) {

            throw new EntityNotFoundException(
                    "IncotermAnnonce non trouvé avec l'id : "
                            + incotermAnnonceId
            );
        }

        incotermAnnonceRepository.deleteById(
                incotermAnnonceId
        );
    }
}