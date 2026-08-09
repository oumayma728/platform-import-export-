package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;

import java.util.List;
import java.util.UUID;

public interface RoleUtilisateurServiceInterface {

    RoleUtilisateurResponseDto create(
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    );

    RoleUtilisateurResponseDto update(
            UUID roleUtilisateurId,
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    );

    RoleUtilisateurResponseDto getById(
            UUID roleUtilisateurId
    );

    List<RoleUtilisateurResponseDto> getAll();

    void delete(
            UUID roleUtilisateurId
    );



    RoleUtilisateurResponseDto affecterRoleToUtilisateur(
            UUID utilisateurId,
            UUID roleId
    );

    void retirerRoleDeUtilisateur(
            UUID utilisateurId,
            UUID roleId
    );
}