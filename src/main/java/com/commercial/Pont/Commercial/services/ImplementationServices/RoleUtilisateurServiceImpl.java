package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.RoleUtilisateurMapperInterface;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.RoleRepository;
import com.commercial.Pont.Commercial.repositories.RoleUtilisateurRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.RoleUtilisateurServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleUtilisateurServiceImpl
        implements RoleUtilisateurServiceInterface {

    private final RoleUtilisateurRepository roleUtilisateurRepository;

    private final RoleUtilisateurMapperInterface roleUtilisateurMapper;

    private final UtilisateurRepository utilisateurRepository;

    private final RoleRepository roleRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public RoleUtilisateurResponseDto create(
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    ) {

        RoleUtilisateur roleUtilisateur =
                roleUtilisateurMapper.requestToEntity(
                        roleUtilisateurRequestDto
                );


        Utilisateur utilisateur =
                utilisateurRepository.findById(
                                roleUtilisateurRequestDto.getUtilisateurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + roleUtilisateurRequestDto.getUtilisateurId()
                                )
                        );


        Role role =
                roleRepository.findById(
                                roleUtilisateurRequestDto.getRoleId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Role non trouvé avec l'id : "
                                                + roleUtilisateurRequestDto.getRoleId()
                                )
                        );


        roleUtilisateur.setUtilisateur(utilisateur);
        roleUtilisateur.setRole(role);
        roleUtilisateur.setCreatedAt(LocalDateTime.now());

        RoleUtilisateur saved =
                roleUtilisateurRepository.save(roleUtilisateur);

        return roleUtilisateurMapper.entityToResponse(saved);
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public RoleUtilisateurResponseDto update(
            UUID roleUtilisateurId,
            RoleUtilisateurRequestDto roleUtilisateurRequestDto
    ) {

        RoleUtilisateur existing =
                roleUtilisateurRepository.findById(roleUtilisateurId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "RoleUtilisateur non trouvé avec l'id : "
                                                + roleUtilisateurId
                                )
                        );


        if (
                roleUtilisateurRequestDto.getUtilisateurId() != null
                        &&
                        (
                                existing.getUtilisateur() == null
                                        ||
                                        !existing.getUtilisateur()
                                                .getUtilisateurId()
                                                .equals(roleUtilisateurRequestDto.getUtilisateurId())
                        )
        ) {

            Utilisateur utilisateur =
                    utilisateurRepository.findById(
                                    roleUtilisateurRequestDto.getUtilisateurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé avec l'id : "
                                                    + roleUtilisateurRequestDto.getUtilisateurId()
                                    )
                            );

            existing.setUtilisateur(utilisateur);
        }


        if (
                roleUtilisateurRequestDto.getRoleId() != null
                        &&
                        (
                                existing.getRole() == null
                                        ||
                                        !existing.getRole()
                                                .getRoleId()
                                                .equals(roleUtilisateurRequestDto.getRoleId())
                        )
        ) {

            Role role =
                    roleRepository.findById(
                                    roleUtilisateurRequestDto.getRoleId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Role non trouvé avec l'id : "
                                                    + roleUtilisateurRequestDto.getRoleId()
                                    )
                            );

            existing.setRole(role);
        }

        RoleUtilisateur updated =
                roleUtilisateurRepository.save(existing);

        return roleUtilisateurMapper.entityToResponse(updated);
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public RoleUtilisateurResponseDto getById(
            UUID roleUtilisateurId
    ) {

        RoleUtilisateur roleUtilisateur =
                roleUtilisateurRepository.findById(roleUtilisateurId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "RoleUtilisateur non trouvé avec l'id : "
                                                + roleUtilisateurId
                                )
                        );

        return roleUtilisateurMapper.entityToResponse(roleUtilisateur);
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<RoleUtilisateurResponseDto> getAll() {

        return roleUtilisateurRepository.findAll()
                .stream()
                .map(roleUtilisateurMapper::entityToResponse)
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID roleUtilisateurId
    ) {

        if (!roleUtilisateurRepository.existsById(roleUtilisateurId)) {
            throw new EntityNotFoundException(
                    "RoleUtilisateur non trouvé avec l'id : "
                            + roleUtilisateurId
            );
        }

        roleUtilisateurRepository.deleteById(roleUtilisateurId);
    }








    @Override
    public RoleUtilisateurResponseDto affecterRoleToUtilisateur(
            UUID utilisateurId,
            UUID roleId
    ) {

        Utilisateur utilisateur =
                utilisateurRepository.findById(utilisateurId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + utilisateurId
                                )
                        );

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Role non trouvé avec l'id : "
                                                + roleId
                                )
                        );

        // Empêcher les doublons
        if (roleUtilisateurRepository.existsByUtilisateurUtilisateurIdAndRoleRoleId(
                utilisateurId,
                roleId
        )) {

            throw new IllegalArgumentException(
                    "Cet utilisateur possède déjà ce rôle."
            );
        }
        RoleUtilisateur roleUtilisateur = RoleUtilisateur.builder()
                .utilisateur(utilisateur)
                .role(role)
                .createdAt(LocalDateTime.now())
                .build();
        RoleUtilisateur saved =
                roleUtilisateurRepository.save(roleUtilisateur);

        return roleUtilisateurMapper.entityToResponse(saved);
    }







    @Override
    public void retirerRoleDeUtilisateur(
            UUID utilisateurId,
            UUID roleId
    ) {

        RoleUtilisateur roleUtilisateur =
                roleUtilisateurRepository
                        .findByUtilisateurUtilisateurIdAndRoleRoleId(
                                utilisateurId,
                                roleId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Ce rôle n'est pas affecté à cet utilisateur."
                                )
                        );

        roleUtilisateurRepository.delete(roleUtilisateur);
    }

}