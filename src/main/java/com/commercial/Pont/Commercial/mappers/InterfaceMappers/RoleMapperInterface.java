package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.models.Role;

public interface RoleMapperInterface {

    /**
     * Convertir RoleRequestDto vers Role
     */
    Role requestToEntity(
            RoleRequestDto roleRequestDto
    );

    /**
     * Convertir Role vers RoleRequestDto
     */
    RoleRequestDto entityToRequest(
            Role role
    );

    /**
     * Convertir Role vers RoleResponseDto
     */
    RoleResponseDto entityToResponse(
            Role role
    );

    /**
     * Convertir RoleResponseDto vers Role
     */
    Role responseToEntity(
            RoleResponseDto roleResponseDto
    );
}