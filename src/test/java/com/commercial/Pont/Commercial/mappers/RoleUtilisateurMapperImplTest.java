package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.RoleUtilisateurMapperImpl;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.RoleRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleUtilisateurMapperImplTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleUtilisateurMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID utilisateurId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        Utilisateur utilisateur =
                mock(Utilisateur.class);

        Role role =
                mock(Role.class);

        RoleUtilisateurRequestDto dto =
                mock(RoleUtilisateurRequestDto.class);

        when(dto.getUtilisateurId())
                .thenReturn(utilisateurId);

        when(dto.getRoleId())
                .thenReturn(roleId);

        when(utilisateurRepository.findById(utilisateurId))
                .thenReturn(Optional.of(utilisateur));

        when(roleRepository.findById(roleId))
                .thenReturn(Optional.of(role));

        RoleUtilisateur result =
                mapper.requestToEntity(dto);

        assertSame(
                utilisateur,
                result.getUtilisateur()
        );

        assertSame(
                role,
                result.getRole()
        );
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldLeaveRelationsNull() {
        RoleUtilisateurRequestDto dto =
                mock(RoleUtilisateurRequestDto.class);

        RoleUtilisateur result =
                mapper.requestToEntity(dto);

        assertNull(result.getUtilisateur());
        assertNull(result.getRole());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID utilisateurId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        Utilisateur utilisateur =
                mock(Utilisateur.class);

        Role role =
                mock(Role.class);

        when(utilisateur.getUtilisateurId())
                .thenReturn(utilisateurId);

        when(role.getRoleId())
                .thenReturn(roleId);

        RoleUtilisateur entity =
                mock(RoleUtilisateur.class);

        when(entity.getUtilisateur())
                .thenReturn(utilisateur);

        when(entity.getRole())
                .thenReturn(role);

        RoleUtilisateurRequestDto request =
                mapper.entityToRequest(entity);

        RoleUtilisateurResponseDto response =
                mapper.entityToResponse(entity);

        assertEquals(
                utilisateurId,
                request.getUtilisateurId()
        );

        assertEquals(
                roleId,
                request.getRoleId()
        );

        assertEquals(
                utilisateurId,
                response.getUtilisateurId()
        );

        assertEquals(
                roleId,
                response.getRoleId()
        );
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID utilisateurId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        Utilisateur utilisateur =
                mock(Utilisateur.class);

        Role role =
                mock(Role.class);

        RoleUtilisateurResponseDto dto =
                mock(RoleUtilisateurResponseDto.class);

        when(dto.getUtilisateurId())
                .thenReturn(utilisateurId);

        when(dto.getRoleId())
                .thenReturn(roleId);

        when(utilisateurRepository.findById(utilisateurId))
                .thenReturn(Optional.of(utilisateur));

        when(roleRepository.findById(roleId))
                .thenReturn(Optional.of(role));

        RoleUtilisateur result =
                mapper.responseToEntity(dto);

        assertSame(
                utilisateur,
                result.getUtilisateur()
        );

        assertSame(
                role,
                result.getRole()
        );
    }
}
