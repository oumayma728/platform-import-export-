package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;

public interface IncotermAnnonceMapperInterface {

    /**
     * Convertir IncotermAnnonceRequestDto vers IncotermAnnonce
     */
    IncotermAnnonce requestToEntity(
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    );

    /**
     * Convertir IncotermAnnonce vers IncotermAnnonceRequestDto
     */
    IncotermAnnonceRequestDto entityToRequest(
            IncotermAnnonce incotermAnnonce
    );

    /**
     * Convertir IncotermAnnonce vers IncotermAnnonceResponseDto
     */
    IncotermAnnonceResponseDto entityToResponse(
            IncotermAnnonce incotermAnnonce
    );

    /**
     * Convertir IncotermAnnonceResponseDto vers IncotermAnnonce
     */
    IncotermAnnonce responseToEntity(
            IncotermAnnonceResponseDto incotermAnnonceResponseDto
    );
}
