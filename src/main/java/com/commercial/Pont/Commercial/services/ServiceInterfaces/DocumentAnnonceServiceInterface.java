package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;

import java.util.List;
import java.util.UUID;

public interface DocumentAnnonceServiceInterface {

    DocumentAnnonceResponseDto create(
            DocumentAnnonceRequestDto documentAnnonceRequestDto
    );

    DocumentAnnonceResponseDto update(
            UUID documentAnnonceId,
            DocumentAnnonceRequestDto documentAnnonceRequestDto
    );

    DocumentAnnonceResponseDto getById(
            UUID documentAnnonceId
    );

    List<DocumentAnnonceResponseDto> getAll();

    void delete(
            UUID documentAnnonceId
    );
}