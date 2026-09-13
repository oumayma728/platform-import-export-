package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.RoleMapperImpl;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.repositories.RoleUtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleMapperImplTest {

    @Mock
    private RoleUtilisateurRepository roleUtilisateurRepository;

    @InjectMocks
    private RoleMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRoleUtilisateurs() {
        UUID id = UUID.randomUUID();

        RoleUtilisateur roleUtilisateur =
                mock(RoleUtilisateur.class);

        RoleRequestDto dto =
                mock(RoleRequestDto.class);

        when(dto.getRoleUtilisateurIds())
                .thenReturn(Set.of(id));

        when(roleUtilisateurRepository.findAllById(Set.of(id)))
                .thenReturn(List.of(roleUtilisateur));

        Role result =
                mapper.requestToEntity(dto);

        assertEquals(
                Set.of(roleUtilisateur),
                result.getUtilisateurs()
        );
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldUseEmptySet() {
        RoleRequestDto dto =
                mock(RoleRequestDto.class);

        Role result =
                mapper.requestToEntity(dto);

        assertNotNull(result);
        assertTrue(result.getUtilisateurs().isEmpty());

        verifyNoInteractions(roleUtilisateurRepository);
    }

    @Test
    void entityToDtos_ShouldExtractRoleUtilisateurIds() {
        UUID id = UUID.randomUUID();

        RoleUtilisateur relation =
                mock(RoleUtilisateur.class);

        when(relation.getRoleUtilisateurId())
                .thenReturn(id);

        Role role =
                mock(Role.class);

        when(role.getUtilisateurs())
                .thenReturn(Set.of(relation));

        RoleRequestDto request =
                mapper.entityToRequest(role);

        RoleResponseDto response =
                mapper.entityToResponse(role);

        assertEquals(
                Set.of(id),
                request.getRoleUtilisateurIds()
        );

        assertEquals(
                Set.of(id),
                response.getRoleUtilisateurIds()
        );
    }

    @Test
    void responseToEntity_ShouldResolveRoleUtilisateurs() {
        UUID id = UUID.randomUUID();

        RoleUtilisateur relation =
                mock(RoleUtilisateur.class);

        RoleResponseDto dto =
                mock(RoleResponseDto.class);

        when(dto.getRoleUtilisateurIds())
                .thenReturn(Set.of(id));

        when(roleUtilisateurRepository.findAllById(Set.of(id)))
                .thenReturn(List.of(relation));

        Role result =
                mapper.responseToEntity(dto);

        assertEquals(
                Set.of(relation),
                result.getUtilisateurs()
        );
    }
}
