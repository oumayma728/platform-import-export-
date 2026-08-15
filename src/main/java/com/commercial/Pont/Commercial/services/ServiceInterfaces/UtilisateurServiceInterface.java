package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.UpdateProfileRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UtilisateurServiceInterface {

    UtilisateurResponseDto create(
            UtilisateurRequestDto utilisateurRequestDto,
            MultipartFile photo
    );

    UtilisateurResponseDto update(
            UUID utilisateurId,
            UtilisateurRequestDto utilisateurRequestDto
    );

    UtilisateurResponseDto getById(
            UUID utilisateurId
    );

    List<UtilisateurResponseDto> getAll();

    void delete(
            UUID utilisateurId
    );


    UtilisateurResponseDto validerUtilisateur(
            UUID utilisateurId
    );

    UtilisateurResponseDto rejeterUtilisateur(
            UUID utilisateurId
    );

    UtilisateurResponseDto suspendreUtilisateur(
            UUID utilisateurId
    );


    UtilisateurResponseDto getByEmail(String email);


    UtilisateurResponseDto updateProfile(
            String currentEmail,
            UpdateProfileRequestDto request
    );
}