package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface RoleUtilisateurServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    RoleUtilisateurResponseDto create(
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    RoleUtilisateurResponseDto update(
            UUID roleUtilisateurId,
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    RoleUtilisateurResponseDto getById(
            UUID roleUtilisateurId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<RoleUtilisateurResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID roleUtilisateurId
    );


    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    RoleUtilisateurResponseDto affecterRoleToUtilisateur(
            UUID utilisateurId,
            UUID roleId
    );

    @PreAuthorize("hasRole('ADMIN')")
    void retirerRoleDeUtilisateur(
            UUID utilisateurId,
            UUID roleId
    );
}