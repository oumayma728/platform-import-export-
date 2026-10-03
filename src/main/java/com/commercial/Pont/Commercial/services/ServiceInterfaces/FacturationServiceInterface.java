package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface FacturationServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    FacturationResponseDto create(
            FacturationRequestDto facturationRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    FacturationResponseDto update(
            UUID facturationId,
            FacturationRequestDto facturationRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    FacturationResponseDto getById(
            UUID facturationId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<FacturationResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID facturationId
    );
}