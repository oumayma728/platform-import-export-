package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface LocationServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    LocationResponseDto create(
            LocationRequestDto locationRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    LocationResponseDto update(
            UUID locationId,
            LocationRequestDto locationRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    LocationResponseDto getById(
            UUID locationId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<LocationResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID locationId
    );
}