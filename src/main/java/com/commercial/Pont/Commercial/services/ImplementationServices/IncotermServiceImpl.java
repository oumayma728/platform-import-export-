package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.IncotermMapperInterface;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.repositories.IncotermRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.IncotermServiceInterface;
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
public class IncotermServiceImpl
        implements IncotermServiceInterface {

    private final IncotermRepository incotermRepository;

    private final IncotermMapperInterface incotermMapper;


    // =========================
    // CREATE
    // =========================

    @Override
    public IncotermResponseDto create(
            IncotermRequestDto incotermRequestDto
    ) {

        Incoterm incoterm =
                incotermMapper.requestToEntity(
                        incotermRequestDto
                );


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        incoterm.setCreatedAt(
                now
        );

        incoterm.setUpdatedAt(
                now
        );


        Incoterm savedIncoterm =
                incotermRepository.save(
                        incoterm
                );

        return incotermMapper.entityToResponse(
                savedIncoterm
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public IncotermResponseDto update(
            UUID incotermId,
            IncotermRequestDto incotermRequestDto
    ) {

        Incoterm existingIncoterm =
                incotermRepository.findById(
                                incotermId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Incoterm non trouvé avec l'id : "
                                                + incotermId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingIncoterm.setCode(
                incotermRequestDto.getCode()
        );

        existingIncoterm.setNom(
                incotermRequestDto.getNom()
        );

        existingIncoterm.setDescription(
                incotermRequestDto.getDescription()
        );


        // =========================
        // Mise à jour automatique
        // =========================

        existingIncoterm.setUpdatedAt(
                LocalDateTime.now()
        );


        Incoterm updatedIncoterm =
                incotermRepository.save(
                        existingIncoterm
                );

        return incotermMapper.entityToResponse(
                updatedIncoterm
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public IncotermResponseDto getById(
            UUID incotermId
    ) {

        Incoterm incoterm =
                incotermRepository.findById(
                                incotermId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Incoterm non trouvé avec l'id : "
                                                + incotermId
                                )
                        );

        return incotermMapper.entityToResponse(
                incoterm
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<IncotermResponseDto> getAll() {

        return incotermRepository.findAll()
                .stream()
                .map(
                        incotermMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID incotermId
    ) {

        if (
                !incotermRepository
                        .existsById(
                                incotermId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Incoterm non trouvé avec l'id : "
                            + incotermId
            );
        }

        incotermRepository.deleteById(
                incotermId
        );
    }
}