package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;

import java.util.List;
import java.util.UUID;

public interface EntrepriseServiceInterface {

    EntrepriseResponseDto create(
            EntrepriseRequestDto entrepriseRequestDto
    );

    EntrepriseResponseDto update(
            UUID entrepriseId,
            EntrepriseRequestDto entrepriseRequestDto
    );

    EntrepriseResponseDto getById(
            UUID entrepriseId
    );

    List<EntrepriseResponseDto> getAll();

    void delete(
            UUID entrepriseId
    );
}