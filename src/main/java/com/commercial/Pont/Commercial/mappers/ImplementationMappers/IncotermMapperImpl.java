package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.IncotermMapperInterface;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.repositories.IncotermAnnonceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class IncotermMapperImpl
        implements IncotermMapperInterface {

    private final IncotermAnnonceRepository incotermAnnonceRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * IncotermRequestDto
     *          ↓
     * Incoterm
     *
     * incotermAnnonceIds → Set<IncotermAnnonce>
     */
    @Override
    public Incoterm requestToEntity(
            IncotermRequestDto incotermRequestDto) {

        if (incotermRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération des IncotermAnnonce
         * ========================================================
         */
        Set<IncotermAnnonce> incoterms =
                Collections.emptySet();

        if (incotermRequestDto.getIncotermAnnonceIds() != null
                && !incotermRequestDto
                .getIncotermAnnonceIds()
                .isEmpty()) {

            incoterms = incotermAnnonceRepository
                    .findAllById(
                            incotermRequestDto
                                    .getIncotermAnnonceIds()
                    )
                    .stream()
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction de l'entité Incoterm
         * ========================================================
         */
        return Incoterm.builder()

                // Informations principales
                .code(
                        incotermRequestDto.getCode()
                )
                .nom(
                        incotermRequestDto.getNom()
                )
                .description(
                        incotermRequestDto.getDescription()
                )
                .createdAt(
                        incotermRequestDto.getCreatedAt()
                )
                .updatedAt(
                        incotermRequestDto.getUpdatedAt()
                )

                // Relation OneToMany
                .incoterms(incoterms)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Incoterm
     *      ↓
     * IncotermRequestDto
     *
     * incoterms → incotermAnnonceIds
     */
    @Override
    public IncotermRequestDto entityToRequest(
            Incoterm incoterm) {

        if (incoterm == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction des IDs des IncotermAnnonce
         * ========================================================
         */
        Set<UUID> incotermAnnonceIds =
                Collections.emptySet();

        if (incoterm.getIncoterms() != null) {

            incotermAnnonceIds = incoterm
                    .getIncoterms()
                    .stream()
                    .map(IncotermAnnonce::getIncotermAnnonceId)
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return IncotermRequestDto.builder()

                // Informations principales
                .code(
                        incoterm.getCode()
                )
                .nom(
                        incoterm.getNom()
                )
                .description(
                        incoterm.getDescription()
                )
                .createdAt(
                        incoterm.getCreatedAt()
                )
                .updatedAt(
                        incoterm.getUpdatedAt()
                )

                // IDs des IncotermAnnonce
                .incotermAnnonceIds(incotermAnnonceIds)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Incoterm
     *      ↓
     * IncotermResponseDto
     *
     * incoterms → incotermAnnonceIds
     */
    @Override
    public IncotermResponseDto entityToResponse(
            Incoterm incoterm) {

        if (incoterm == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction des IDs des IncotermAnnonce
         * ========================================================
         */
        Set<UUID> incotermAnnonceIds =
                Collections.emptySet();

        if (incoterm.getIncoterms() != null) {

            incotermAnnonceIds = incoterm
                    .getIncoterms()
                    .stream()
                    .map(IncotermAnnonce::getIncotermAnnonceId)
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return IncotermResponseDto.builder()

                // ID de l'Incoterm
                .incotermId(
                        incoterm.getIncotermId()
                )

                // Informations principales
                .code(
                        incoterm.getCode()
                )
                .nom(
                        incoterm.getNom()
                )
                .description(
                        incoterm.getDescription()
                )
                .createdAt(
                        incoterm.getCreatedAt()
                )
                .updatedAt(
                        incoterm.getUpdatedAt()
                )

                // IDs des IncotermAnnonce
                .incotermAnnonceIds(incotermAnnonceIds)

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * IncotermResponseDto
     *          ↓
     * Incoterm
     *
     * incotermAnnonceIds → Set<IncotermAnnonce>
     */
    @Override
    public Incoterm responseToEntity(
            IncotermResponseDto incotermResponseDto) {

        if (incotermResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération des IncotermAnnonce
         * ========================================================
         */
        Set<IncotermAnnonce> incoterms =
                Collections.emptySet();

        if (incotermResponseDto.getIncotermAnnonceIds() != null
                && !incotermResponseDto
                .getIncotermAnnonceIds()
                .isEmpty()) {

            incoterms = incotermAnnonceRepository
                    .findAllById(
                            incotermResponseDto
                                    .getIncotermAnnonceIds()
                    )
                    .stream()
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction de l'entité Incoterm
         * ========================================================
         */
        return Incoterm.builder()

                // ID de l'Incoterm
                .incotermId(
                        incotermResponseDto
                                .getIncotermId()
                )

                // Informations principales
                .code(
                        incotermResponseDto.getCode()
                )
                .nom(
                        incotermResponseDto.getNom()
                )
                .description(
                        incotermResponseDto.getDescription()
                )
                .createdAt(
                        incotermResponseDto.getCreatedAt()
                )
                .updatedAt(
                        incotermResponseDto.getUpdatedAt()
                )

                // Relation OneToMany
                .incoterms(incoterms)

                .build();
    }
}
