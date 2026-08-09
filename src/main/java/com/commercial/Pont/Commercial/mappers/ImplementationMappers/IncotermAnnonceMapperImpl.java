package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.IncotermAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class IncotermAnnonceMapperImpl
        implements IncotermAnnonceMapperInterface {

    private final IncotermRepository incotermRepository;

    private final AnnonceRepository annonceRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * IncotermAnnonceRequestDto
     *              ↓
     *       IncotermAnnonce
     *
     * incotermId → Incoterm
     * annonceId  → Annonce
     */
    @Override
    public IncotermAnnonce requestToEntity(
            IncotermAnnonceRequestDto incotermAnnonceRequestDto) {

        if (incotermAnnonceRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Incoterm
         * ========================================================
         */
        Incoterm incoterm = null;

        if (incotermAnnonceRequestDto.getIncotermId() != null) {

            incoterm = incotermRepository
                    .findById(
                            incotermAnnonceRequestDto
                                    .getIncotermId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Annonce
         * ========================================================
         */
        Annonce annonce = null;

        if (incotermAnnonceRequestDto.getAnnonceId() != null) {

            annonce = annonceRepository
                    .findById(
                            incotermAnnonceRequestDto
                                    .getAnnonceId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité IncotermAnnonce
         * ========================================================
         */
        return IncotermAnnonce.builder()

                // ID de la relation
                .incotermAnnonceId(
                        incotermAnnonceRequestDto
                                .getIncotermAnnonceId()
                )

                // Informations
                .createdAt(
                        incotermAnnonceRequestDto.getCreatedAt()
                )
                .updatedAt(
                        incotermAnnonceRequestDto.getUpdatedAt()
                )

                // Relations
                .incoterm(incoterm)
                .annonce(annonce)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * IncotermAnnonce
     *        ↓
     * IncotermAnnonceRequestDto
     *
     * incoterm → incotermId
     * annonce  → annonceId
     */
    @Override
    public IncotermAnnonceRequestDto entityToRequest(
            IncotermAnnonce incotermAnnonce) {

        if (incotermAnnonce == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Incoterm
         * ========================================================
         */
        UUID incotermId = null;

        if (incotermAnnonce.getIncoterm() != null) {

            incotermId = incotermAnnonce
                    .getIncoterm()
                    .getIncotermId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Annonce
         * ========================================================
         */
        UUID annonceId = null;

        if (incotermAnnonce.getAnnonce() != null) {

            annonceId = incotermAnnonce
                    .getAnnonce()
                    .getAnnonceId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return IncotermAnnonceRequestDto.builder()

                // IDs des relations
                .incotermId(incotermId)
                .annonceId(annonceId)

                // ID de l'association
                .incotermAnnonceId(
                        incotermAnnonce
                                .getIncotermAnnonceId()
                )

                // Informations
                .createdAt(
                        incotermAnnonce.getCreatedAt()
                )
                .updatedAt(
                        incotermAnnonce.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * IncotermAnnonce
     *        ↓
     * IncotermAnnonceResponseDto
     *
     * incoterm → incotermId
     * annonce  → annonceId
     */
    @Override
    public IncotermAnnonceResponseDto entityToResponse(
            IncotermAnnonce incotermAnnonce) {

        if (incotermAnnonce == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Incoterm
         * ========================================================
         */
        UUID incotermId = null;

        if (incotermAnnonce.getIncoterm() != null) {

            incotermId = incotermAnnonce
                    .getIncoterm()
                    .getIncotermId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Annonce
         * ========================================================
         */
        UUID annonceId = null;

        if (incotermAnnonce.getAnnonce() != null) {

            annonceId = incotermAnnonce
                    .getAnnonce()
                    .getAnnonceId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return IncotermAnnonceResponseDto.builder()

                // IDs des relations
                .incotermId(incotermId)
                .annonceId(annonceId)

                // ID de l'association
                .incotermAnnonceId(
                        incotermAnnonce
                                .getIncotermAnnonceId()
                )

                // Informations
                .createdAt(
                        incotermAnnonce.getCreatedAt()
                )
                .updatedAt(
                        incotermAnnonce.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * IncotermAnnonceResponseDto
     *              ↓
     *       IncotermAnnonce
     *
     * incotermId → Incoterm
     * annonceId  → Annonce
     */
    @Override
    public IncotermAnnonce responseToEntity(
            IncotermAnnonceResponseDto incotermAnnonceResponseDto) {

        if (incotermAnnonceResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Incoterm
         * ========================================================
         */
        Incoterm incoterm = null;

        if (incotermAnnonceResponseDto.getIncotermId() != null) {

            incoterm = incotermRepository
                    .findById(
                            incotermAnnonceResponseDto
                                    .getIncotermId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Annonce
         * ========================================================
         */
        Annonce annonce = null;

        if (incotermAnnonceResponseDto.getAnnonceId() != null) {

            annonce = annonceRepository
                    .findById(
                            incotermAnnonceResponseDto
                                    .getAnnonceId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité IncotermAnnonce
         * ========================================================
         */
        return IncotermAnnonce.builder()

                // ID de l'association
                .incotermAnnonceId(
                        incotermAnnonceResponseDto
                                .getIncotermAnnonceId()
                )

                // Informations
                .createdAt(
                        incotermAnnonceResponseDto.getCreatedAt()
                )
                .updatedAt(
                        incotermAnnonceResponseDto.getUpdatedAt()
                )

                // Relations
                .incoterm(incoterm)
                .annonce(annonce)

                .build();
    }
}
