package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.RoleMapperInterface;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.repositories.RoleRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.RoleServiceInterface;
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
public class RoleServiceImpl implements RoleServiceInterface {

    private final RoleRepository roleRepository;

    private final RoleMapperInterface roleMapper;


    // =========================
    // CREATE
    // =========================

    @Override
    public RoleResponseDto create(
            RoleRequestDto roleRequestDto
    ) {

        Role role =
                roleMapper.requestToEntity(
                        roleRequestDto
                );


        LocalDateTime now =
                LocalDateTime.now();

        role.setCreatedAt(
                now
        );

        role.setUpdatedAt(
                now
        );
        Role savedRole =
                roleRepository.save(
                        role
                );
        return roleMapper.entityToResponse(
                savedRole
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public RoleResponseDto update(
            UUID roleId,
            RoleRequestDto roleRequestDto
    ) {

        Role existingRole =
                roleRepository.findById(
                                roleId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Role non trouvé avec l'id : "
                                                + roleId
                                )
                        );


        // =========================
        // Mise à jour
        // =========================

        existingRole.setCode(
                roleRequestDto.getCode()
        );

        existingRole.setNom(
                roleRequestDto.getNom()
        );

        existingRole.setDescription(
                roleRequestDto.getDescription()
        );


        // =========================
        // Mise à jour automatique
        // =========================

        existingRole.setUpdatedAt(
                LocalDateTime.now()
        );


        // =========================
        // Sauvegarde
        // =========================

        Role updatedRole =
                roleRepository.save(
                        existingRole
                );

        return roleMapper.entityToResponse(
                updatedRole
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public RoleResponseDto getById(
            UUID roleId
    ) {

        Role role =
                roleRepository.findById(
                                roleId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Role non trouvé avec l'id : "
                                                + roleId
                                )
                        );

        return roleMapper.entityToResponse(
                role
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponseDto> getAll() {

        return roleRepository.findAll()
                .stream()
                .map(
                        roleMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID roleId
    ) {

        if (
                !roleRepository
                        .existsById(
                                roleId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Role non trouvé avec l'id : "
                            + roleId
            );
        }

        roleRepository.deleteById(
                roleId
        );
    }
}