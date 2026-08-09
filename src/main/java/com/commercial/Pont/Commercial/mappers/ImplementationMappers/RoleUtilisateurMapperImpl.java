package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.RoleUtilisateurMapperInterface;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.RoleRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RoleUtilisateurMapperImpl
        implements RoleUtilisateurMapperInterface {

    private final UtilisateurRepository utilisateurRepository;

    private final RoleRepository roleRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * RoleUtilisateurRequestDto
     *             ↓
     *       RoleUtilisateur
     *
     * utilisateurId → Utilisateur
     * roleId        → Role
     */
    @Override
    public RoleUtilisateur requestToEntity(
            RoleUtilisateurRequestDto roleUtilisateurRequestDto) {

        if (roleUtilisateurRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (roleUtilisateurRequestDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            roleUtilisateurRequestDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération du Role
         * ========================================================
         */
        Role role = null;

        if (roleUtilisateurRequestDto.getRoleId() != null) {

            role = roleRepository
                    .findById(
                            roleUtilisateurRequestDto
                                    .getRoleId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité RoleUtilisateur
         * ========================================================
         */
        return RoleUtilisateur.builder()

                // Relations
                .utilisateur(utilisateur)
                .role(role)

                // Informations principales
                .createdAt(
                        roleUtilisateurRequestDto
                                .getCreatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * RoleUtilisateur
     *       ↓
     * RoleUtilisateurRequestDto
     *
     * utilisateur → utilisateurId
     * role        → roleId
     */
    @Override
    public RoleUtilisateurRequestDto entityToRequest(
            RoleUtilisateur roleUtilisateur) {

        if (roleUtilisateur == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (roleUtilisateur.getUtilisateur() != null) {

            utilisateurId = roleUtilisateur
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID du Role
         * ========================================================
         */
        UUID roleId = null;

        if (roleUtilisateur.getRole() != null) {

            roleId = roleUtilisateur
                    .getRole()
                    .getRoleId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return RoleUtilisateurRequestDto.builder()

                // IDs des relations
                .utilisateurId(utilisateurId)
                .roleId(roleId)

                // Informations principales
                .createdAt(
                        roleUtilisateur
                                .getCreatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * RoleUtilisateur
     *       ↓
     * RoleUtilisateurResponseDto
     *
     * utilisateur → utilisateurId
     * role        → roleId
     */
    @Override
    public RoleUtilisateurResponseDto entityToResponse(
            RoleUtilisateur roleUtilisateur) {

        if (roleUtilisateur == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (roleUtilisateur.getUtilisateur() != null) {

            utilisateurId = roleUtilisateur
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID du Role
         * ========================================================
         */
        UUID roleId = null;

        if (roleUtilisateur.getRole() != null) {

            roleId = roleUtilisateur
                    .getRole()
                    .getRoleId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return RoleUtilisateurResponseDto.builder()

                // IDs des relations
                .utilisateurId(utilisateurId)
                .roleId(roleId)

                // ID du RoleUtilisateur
                .roleUtilisateurId(
                        roleUtilisateur
                                .getRoleUtilisateurId()
                )

                // Informations principales
                .createdAt(
                        roleUtilisateur
                                .getCreatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * RoleUtilisateurResponseDto
     *             ↓
     *       RoleUtilisateur
     *
     * utilisateurId → Utilisateur
     * roleId        → Role
     */
    @Override
    public RoleUtilisateur responseToEntity(
            RoleUtilisateurResponseDto roleUtilisateurResponseDto) {

        if (roleUtilisateurResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (roleUtilisateurResponseDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            roleUtilisateurResponseDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération du Role
         * ========================================================
         */
        Role role = null;

        if (roleUtilisateurResponseDto.getRoleId() != null) {

            role = roleRepository
                    .findById(
                            roleUtilisateurResponseDto
                                    .getRoleId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité RoleUtilisateur
         * ========================================================
         */
        return RoleUtilisateur.builder()

                // ID du RoleUtilisateur
                .roleUtilisateurId(
                        roleUtilisateurResponseDto
                                .getRoleUtilisateurId()
                )

                // Relations
                .utilisateur(utilisateur)
                .role(role)

                // Informations principales
                .createdAt(
                        roleUtilisateurResponseDto
                                .getCreatedAt()
                )

                .build();
    }
}