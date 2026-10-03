package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.UpdateProfileRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface UtilisateurServiceInterface {

    UtilisateurResponseDto create(
            UtilisateurRequestDto utilisateurRequestDto,
            MultipartFile photo
    );

    @PreAuthorize("hasRole('ADMIN')")
    UtilisateurResponseDto update(
            UUID utilisateurId,
            UtilisateurRequestDto utilisateurRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    UtilisateurResponseDto getById(
            UUID utilisateurId
    );
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<UtilisateurResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID utilisateurId
    );

    @PreAuthorize("hasRole('ADMIN')")
    UtilisateurResponseDto validerUtilisateur(
            UUID utilisateurId
    );

    @PreAuthorize("hasRole('ADMIN')")
    UtilisateurResponseDto rejeterUtilisateur(
            UUID utilisateurId
    );

    @PreAuthorize("hasRole('ADMIN')")
    UtilisateurResponseDto suspendreUtilisateur(
            UUID utilisateurId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    UtilisateurResponseDto getByEmail(String email);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    UtilisateurResponseDto updateProfile(
            String currentEmail,
            UpdateProfileRequestDto request
    );
}