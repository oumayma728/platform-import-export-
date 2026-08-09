package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.models.Facturation;

public interface FacturationMapperInterface {

    /**
     * Convertir FacturationRequestDto vers Facturation
     */
    Facturation requestToEntity(
            FacturationRequestDto facturationRequestDto
    );

    /**
     * Convertir Facturation vers FacturationRequestDto
     */
    FacturationRequestDto entityToRequest(
            Facturation facturation
    );

    /**
     * Convertir Facturation vers FacturationResponseDto
     */
    FacturationResponseDto entityToResponse(
            Facturation facturation
    );

    /**
     * Convertir FacturationResponseDto vers Facturation
     */
    Facturation responseToEntity(
            FacturationResponseDto facturationResponseDto
    );
}
