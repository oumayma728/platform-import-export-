package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface RoleServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    RoleResponseDto create(RoleRequestDto roleRequestDto);

    @PreAuthorize("hasRole('ADMIN')")
    RoleResponseDto update(UUID roleId, RoleRequestDto roleRequestDto);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    RoleResponseDto getById(UUID roleId);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<RoleResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(UUID roleId);
}