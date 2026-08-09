package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.models.Location;

public interface LocationMapperInterface {

    /**
     * Convertir LocationRequestDto vers Location
     */
    Location requestToEntity(
            LocationRequestDto locationRequestDto
    );

    /**
     * Convertir Location vers LocationRequestDto
     */
    LocationRequestDto entityToRequest(
            Location location
    );

    /**
     * Convertir Location vers LocationResponseDto
     */
    LocationResponseDto entityToResponse(
            Location location
    );

    /**
     * Convertir LocationResponseDto vers Location
     */
    Location responseToEntity(
            LocationResponseDto locationResponseDto
    );
}
