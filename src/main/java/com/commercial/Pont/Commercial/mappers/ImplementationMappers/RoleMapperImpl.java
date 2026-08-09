package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.RoleMapperInterface;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.repositories.RoleUtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RoleMapperImpl
        implements RoleMapperInterface {

    private final RoleUtilisateurRepository roleUtilisateurRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * RoleRequestDto
     *       ↓
     *      Role
     *
     * roleUtilisateurIds → Set<RoleUtilisateur>
     */
    @Override
    public Role requestToEntity(
            RoleRequestDto roleRequestDto) {

        if (roleRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération des RoleUtilisateur
         * ========================================================
         */
        Set<RoleUtilisateur> roles = Collections.emptySet();

        if (roleRequestDto.getRoleUtilisateurIds() != null
                && !roleRequestDto.getRoleUtilisateurIds().isEmpty()) {

            roles = roleUtilisateurRepository
                    .findAllById(
                            roleRequestDto
                                    .getRoleUtilisateurIds()
                    )
                    .stream()
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction de l'entité Role
         * ========================================================
         */
        return Role.builder()

                // Informations principales
                .code(
                        roleRequestDto.getCode()
                )
                .nom(
                        roleRequestDto.getNom()
                )
                .description(
                        roleRequestDto.getDescription()
                )
                .createdAt(
                        roleRequestDto.getCreatedAt()
                )
                .updatedAt(
                        roleRequestDto.getUpdatedAt()
                )

                // Relation avec RoleUtilisateur
                .utilisateurs(roles)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Role
     *  ↓
     * RoleRequestDto
     *
     * Set<RoleUtilisateur>
     *  ↓
     * Set<UUID>
     */
    @Override
    public RoleRequestDto entityToRequest(
            Role role) {

        if (role == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction des IDs RoleUtilisateur
         * ========================================================
         */
        Set<UUID> roleUtilisateurIds =
                Collections.emptySet();

        if (role.getUtilisateurs() != null) {

            roleUtilisateurIds = role
                    .getUtilisateurs()
                    .stream()
                    .map(RoleUtilisateur::getRoleUtilisateurId)
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return RoleRequestDto.builder()

                // Informations principales
                .code(
                        role.getCode()
                )
                .nom(
                        role.getNom()
                )
                .description(
                        role.getDescription()
                )
                .createdAt(
                        role.getCreatedAt()
                )
                .updatedAt(
                        role.getUpdatedAt()
                )

                // IDs des RoleUtilisateur
                .roleUtilisateurIds(
                        roleUtilisateurIds
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Role
     *  ↓
     * RoleResponseDto
     *
     * Set<RoleUtilisateur>
     *  ↓
     * Set<UUID>
     */
    @Override
    public RoleResponseDto entityToResponse(
            Role role) {

        if (role == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction des IDs RoleUtilisateur
         * ========================================================
         */
        Set<UUID> roleUtilisateurIds =
                Collections.emptySet();

        if (role.getUtilisateurs() != null) {

            roleUtilisateurIds = role
                    .getUtilisateurs()
                    .stream()
                    .map(RoleUtilisateur::getRoleUtilisateurId)
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return RoleResponseDto.builder()

                // ID du Role
                .roleId(
                        role.getRoleId()
                )

                // Informations principales
                .code(
                        role.getCode()
                )
                .nom(
                        role.getNom()
                )
                .description(
                        role.getDescription()
                )
                .createdAt(
                        role.getCreatedAt()
                )
                .updatedAt(
                        role.getUpdatedAt()
                )

                // IDs des RoleUtilisateur
                .roleUtilisateurIds(
                        roleUtilisateurIds
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * RoleResponseDto
     *       ↓
     *      Role
     *
     * roleUtilisateurIds → Set<RoleUtilisateur>
     */
    @Override
    public Role responseToEntity(
            RoleResponseDto roleResponseDto) {

        if (roleResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération des RoleUtilisateur
         * ========================================================
         */
        Set<RoleUtilisateur> roles =
                Collections.emptySet();

        if (roleResponseDto.getRoleUtilisateurIds() != null
                && !roleResponseDto
                .getRoleUtilisateurIds()
                .isEmpty()) {

            roles = roleUtilisateurRepository
                    .findAllById(
                            roleResponseDto
                                    .getRoleUtilisateurIds()
                    )
                    .stream()
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction de l'entité Role
         * ========================================================
         */
        return Role.builder()

                // ID du Role
                .roleId(
                        roleResponseDto
                                .getRoleId()
                )

                // Informations principales
                .code(
                        roleResponseDto.getCode()
                )
                .nom(
                        roleResponseDto.getNom()
                )
                .description(
                        roleResponseDto.getDescription()
                )
                .createdAt(
                        roleResponseDto.getCreatedAt()
                )
                .updatedAt(
                        roleResponseDto.getUpdatedAt()
                )

                // Relation avec RoleUtilisateur
                .utilisateurs(roles)

                .build();
    }
}