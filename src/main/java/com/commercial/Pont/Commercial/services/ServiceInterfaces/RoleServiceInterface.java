package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;

import java.util.List;
import java.util.UUID;

public interface RoleServiceInterface {

    RoleResponseDto create(
            RoleRequestDto roleRequestDto
    );

    RoleResponseDto update(
            UUID roleId,
            RoleRequestDto roleRequestDto
    );

    RoleResponseDto getById(
            UUID roleId
    );

    List<RoleResponseDto> getAll();

    void delete(
            UUID roleId
    );
}