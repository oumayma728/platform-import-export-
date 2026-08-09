package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;

import java.util.List;
import java.util.UUID;

public interface AbonnementServiceInterface {

    AbonnementResponseDto create(AbonnementRequestDto abonnementRequestDto);

    AbonnementResponseDto update(UUID abonnementId, AbonnementRequestDto abonnementRequestDto);

    AbonnementResponseDto getById(UUID abonnementId);

    List<AbonnementResponseDto> getAll();

    void delete(UUID abonnementId);
}