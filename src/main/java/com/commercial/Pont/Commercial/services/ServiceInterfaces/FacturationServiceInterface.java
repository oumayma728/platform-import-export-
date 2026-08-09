package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;

import java.util.List;
import java.util.UUID;

public interface FacturationServiceInterface {

    FacturationResponseDto create(
            FacturationRequestDto facturationRequestDto
    );

    FacturationResponseDto update(
            UUID facturationId,
            FacturationRequestDto facturationRequestDto
    );

    FacturationResponseDto getById(
            UUID facturationId
    );

    List<FacturationResponseDto> getAll();

    void delete(
            UUID facturationId
    );
}