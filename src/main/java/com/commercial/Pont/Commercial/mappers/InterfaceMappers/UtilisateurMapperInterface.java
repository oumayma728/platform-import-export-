package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.models.Utilisateur;

public interface UtilisateurMapperInterface {

    /**
     * Convertir UtilisateurRequestDto vers Utilisateur
     */
    Utilisateur requestToEntity(
            UtilisateurRequestDto utilisateurRequestDto
    );

    /**
     * Convertir Utilisateur vers UtilisateurRequestDto
     */
    UtilisateurRequestDto entityToRequest(
            Utilisateur utilisateur
    );

    /**
     * Convertir Utilisateur vers UtilisateurResponseDto
     */
    UtilisateurResponseDto entityToResponse(
            Utilisateur utilisateur
    );

    /**
     * Convertir UtilisateurResponseDto vers Utilisateur
     */
    Utilisateur responseToEntity(
            UtilisateurResponseDto utilisateurResponseDto
    );
}