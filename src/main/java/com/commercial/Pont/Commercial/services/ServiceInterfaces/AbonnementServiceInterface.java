package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface AbonnementServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    AbonnementResponseDto create(AbonnementRequestDto abonnementRequestDto);

    @PreAuthorize("hasRole('ADMIN')")
    AbonnementResponseDto update(UUID abonnementId, AbonnementRequestDto abonnementRequestDto);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    AbonnementResponseDto getById(UUID abonnementId);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AbonnementResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(UUID abonnementId);
}