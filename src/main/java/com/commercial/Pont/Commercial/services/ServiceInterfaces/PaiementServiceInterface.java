package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface PaiementServiceInterface {

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    PaiementResponseDto create(
            PaiementRequestDto paiementRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    PaiementResponseDto update(
            UUID paiementId,
            PaiementRequestDto paiementRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    PaiementResponseDto getById(
            UUID paiementId
    );

    @PreAuthorize("hasRole('ADMIN')")
    List<PaiementResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID paiementId
    );
}