package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;

import java.util.List;
import java.util.UUID;

public interface IncotermServiceInterface {

    IncotermResponseDto create(
            IncotermRequestDto incotermRequestDto
    );

    IncotermResponseDto update(
            UUID incotermId,
            IncotermRequestDto incotermRequestDto
    );

    IncotermResponseDto getById(
            UUID incotermId
    );

    List<IncotermResponseDto> getAll();

    void delete(
            UUID incotermId
    );
}