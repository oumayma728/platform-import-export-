package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface DocumentAnnonceServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    DocumentAnnonceResponseDto create(
            DocumentAnnonceRequestDto requestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    DocumentAnnonceResponseDto update(
            UUID documentAnnonceId,
            DocumentAnnonceRequestDto requestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    DocumentAnnonceResponseDto getById(
            UUID documentAnnonceId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<DocumentAnnonceResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID documentAnnonceId
    );


    // =========================
    // Gestion fichiers annonce
    // =========================
    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    DocumentAnnonceResponseDto addDocumentToAnnonce(
            UUID annonceId,
            MultipartFile file
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<DocumentAnnonceResponseDto> getDocumentsByAnnonce(
            UUID annonceId
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    void deleteDocumentFromAnnonce(
            UUID annonceId,
            UUID documentAnnonceId
    );
}