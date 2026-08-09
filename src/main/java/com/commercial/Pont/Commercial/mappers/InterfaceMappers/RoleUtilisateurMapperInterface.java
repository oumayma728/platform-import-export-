package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;

public interface RoleUtilisateurMapperInterface {

    /**
     * Convertir RoleUtilisateurRequestDto vers RoleUtilisateur
     */
    RoleUtilisateur requestToEntity(
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    );

    /**
     * Convertir RoleUtilisateur vers RoleUtilisateurRequestDto
     */
    RoleUtilisateurRequestDto entityToRequest(
            RoleUtilisateur roleUtilisateur
    );

    /**
     * Convertir RoleUtilisateur vers RoleUtilisateurResponseDto
     */
    RoleUtilisateurResponseDto entityToResponse(
            RoleUtilisateur roleUtilisateur
    );

    /**
     * Convertir RoleUtilisateurResponseDto vers RoleUtilisateur
     */
    RoleUtilisateur responseToEntity(
            RoleUtilisateurResponseDto roleUtilisateurResponseDto
    );
}