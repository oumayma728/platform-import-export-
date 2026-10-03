package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface IncotermAnnonceServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    IncotermAnnonceResponseDto create(
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    IncotermAnnonceResponseDto update(
            UUID incotermAnnonceId,
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    IncotermAnnonceResponseDto getById(
            UUID incotermAnnonceId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<IncotermAnnonceResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID incotermAnnonceId
    );
}