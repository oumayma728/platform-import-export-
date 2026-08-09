package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;

import java.util.List;
import java.util.UUID;

public interface LocationServiceInterface {

    LocationResponseDto create(
            LocationRequestDto locationRequestDto
    );

    LocationResponseDto update(
            UUID locationId,
            LocationRequestDto locationRequestDto
    );

    LocationResponseDto getById(
            UUID locationId
    );

    List<LocationResponseDto> getAll();

    void delete(
            UUID locationId
    );
}