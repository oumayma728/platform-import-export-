package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

public interface EntrepriseServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    EntrepriseResponseDto create(
            EntrepriseRequestDto entrepriseRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    EntrepriseResponseDto update(
            UUID entrepriseId,
            EntrepriseRequestDto entrepriseRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    EntrepriseResponseDto getById(
            UUID entrepriseId
    );

    @PreAuthorize("hasRole('ADMIN')")
    List<EntrepriseResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID entrepriseId
    );
}