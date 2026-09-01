package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface DocumentAnnonceServiceInterface {

    DocumentAnnonceResponseDto create(
            DocumentAnnonceRequestDto requestDto
    );

    DocumentAnnonceResponseDto update(
            UUID documentAnnonceId,
            DocumentAnnonceRequestDto requestDto
    );

    DocumentAnnonceResponseDto getById(
            UUID documentAnnonceId
    );

    List<DocumentAnnonceResponseDto> getAll();

    void delete(
            UUID documentAnnonceId
    );


    // =========================
    // Gestion fichiers annonce
    // =========================

    DocumentAnnonceResponseDto addDocumentToAnnonce(
            UUID annonceId,
            MultipartFile file
    );

    List<DocumentAnnonceResponseDto> getDocumentsByAnnonce(
            UUID annonceId
    );

    void deleteDocumentFromAnnonce(
            UUID annonceId,
            UUID documentAnnonceId
    );
}