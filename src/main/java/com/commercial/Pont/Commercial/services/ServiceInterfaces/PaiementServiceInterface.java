package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;

import java.util.List;
import java.util.UUID;

public interface PaiementServiceInterface {

    PaiementResponseDto create(
            PaiementRequestDto paiementRequestDto
    );

    PaiementResponseDto update(
            UUID paiementId,
            PaiementRequestDto paiementRequestDto
    );

    PaiementResponseDto getById(
            UUID paiementId
    );

    List<PaiementResponseDto> getAll();

    void delete(
            UUID paiementId
    );
}