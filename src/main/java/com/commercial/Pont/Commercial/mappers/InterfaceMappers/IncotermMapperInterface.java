package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.models.Incoterm;

public interface IncotermMapperInterface {

    /**
     * Convertir IncotermRequestDto vers Incoterm
     */
    Incoterm requestToEntity(
            IncotermRequestDto incotermRequestDto
    );

    /**
     * Convertir Incoterm vers IncotermRequestDto
     */
    IncotermRequestDto entityToRequest(
            Incoterm incoterm
    );

    /**
     * Convertir Incoterm vers IncotermResponseDto
     */
    IncotermResponseDto entityToResponse(
            Incoterm incoterm
    );

    /**
     * Convertir IncotermResponseDto vers Incoterm
     */
    Incoterm responseToEntity(
            IncotermResponseDto incotermResponseDto
    );
}
