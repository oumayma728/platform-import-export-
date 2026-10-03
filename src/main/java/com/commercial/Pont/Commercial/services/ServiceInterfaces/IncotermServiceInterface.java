package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface IncotermServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    IncotermResponseDto create(
            IncotermRequestDto incotermRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    IncotermResponseDto update(
            UUID incotermId,
            IncotermRequestDto incotermRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    IncotermResponseDto getById(
            UUID incotermId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<IncotermResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID incotermId
    );
}