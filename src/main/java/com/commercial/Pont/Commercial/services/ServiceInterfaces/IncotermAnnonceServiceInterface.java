package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;

import java.util.List;
import java.util.UUID;

public interface IncotermAnnonceServiceInterface {

    IncotermAnnonceResponseDto create(
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    );

    IncotermAnnonceResponseDto update(
            UUID incotermAnnonceId,
            IncotermAnnonceRequestDto incotermAnnonceRequestDto
    );

    IncotermAnnonceResponseDto getById(
            UUID incotermAnnonceId
    );

    List<IncotermAnnonceResponseDto> getAll();

    void delete(
            UUID incotermAnnonceId
    );
}