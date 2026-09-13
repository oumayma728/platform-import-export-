package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.RoleUtilisateurMapperInterface;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.RoleRepository;
import com.commercial.Pont.Commercial.repositories.RoleUtilisateurRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.RoleUtilisateurServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleUtilisateurServiceImplTest {

    @Mock private RoleUtilisateurRepository roleUtilisateurRepository;
    @Mock private RoleUtilisateurMapperInterface roleUtilisateurMapper;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private RoleRepository roleRepository;

    @InjectMocks
    private RoleUtilisateurServiceImpl service;

    private UUID userId;
    private UUID roleId;
    private Utilisateur user;
    private Role role;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        roleId = UUID.randomUUID();

        user = new Utilisateur();
        user.setUtilisateurId(userId);

        role = new Role();
        role.setRoleId(roleId);
    }

    @Test
    void create_ShouldCreateRelation() {
        RoleUtilisateurRequestDto request =
                mock(RoleUtilisateurRequestDto.class);
        RoleUtilisateur relation = new RoleUtilisateur();
        RoleUtilisateurResponseDto response =
                mock(RoleUtilisateurResponseDto.class);

        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getRoleId()).thenReturn(roleId);
        when(roleUtilisateurMapper.requestToEntity(request))
                .thenReturn(relation);
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(roleRepository.findById(roleId))
                .thenReturn(Optional.of(role));
        when(roleUtilisateurRepository.save(relation))
                .thenReturn(relation);
        when(roleUtilisateurMapper.entityToResponse(relation))
                .thenReturn(response);

        assertSame(response, service.create(request));
        assertSame(user, relation.getUtilisateur());
        assertSame(role, relation.getRole());
        assertNotNull(relation.getCreatedAt());
    }

    @Test
    void create_ShouldThrow_WhenUserMissing() {
        RoleUtilisateurRequestDto request =
                mock(RoleUtilisateurRequestDto.class);

        when(request.getUtilisateurId()).thenReturn(userId);
        when(roleUtilisateurMapper.requestToEntity(request))
                .thenReturn(new RoleUtilisateur());
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void create_ShouldThrow_WhenRoleMissing() {
        RoleUtilisateurRequestDto request =
                mock(RoleUtilisateurRequestDto.class);

        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getRoleId()).thenReturn(roleId);
        when(roleUtilisateurMapper.requestToEntity(request))
                .thenReturn(new RoleUtilisateur());
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(roleRepository.findById(roleId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void update_ShouldChangeUserAndRole() {
        UUID relationId = UUID.randomUUID();
        UUID newUserId = UUID.randomUUID();
        UUID newRoleId = UUID.randomUUID();

        Utilisateur newUser = new Utilisateur();
        newUser.setUtilisateurId(newUserId);

        Role newRole = new Role();
        newRole.setRoleId(newRoleId);

        RoleUtilisateur existing = new RoleUtilisateur();
        existing.setUtilisateur(user);
        existing.setRole(role);

        RoleUtilisateurRequestDto request =
                mock(RoleUtilisateurRequestDto.class);
        when(request.getUtilisateurId()).thenReturn(newUserId);
        when(request.getRoleId()).thenReturn(newRoleId);

        when(roleUtilisateurRepository.findById(relationId))
                .thenReturn(Optional.of(existing));
        when(utilisateurRepository.findById(newUserId))
                .thenReturn(Optional.of(newUser));
        when(roleRepository.findById(newRoleId))
                .thenReturn(Optional.of(newRole));
        when(roleUtilisateurRepository.save(existing))
                .thenReturn(existing);

        service.update(relationId, request);

        assertSame(newUser, existing.getUtilisateur());
        assertSame(newRole, existing.getRole());
    }

    @Test
    void update_ShouldNotReload_WhenIdsAreSame() {
        UUID relationId = UUID.randomUUID();
        RoleUtilisateur existing = new RoleUtilisateur();
        existing.setUtilisateur(user);
        existing.setRole(role);

        RoleUtilisateurRequestDto request =
                mock(RoleUtilisateurRequestDto.class);
        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getRoleId()).thenReturn(roleId);

        when(roleUtilisateurRepository.findById(relationId))
                .thenReturn(Optional.of(existing));
        when(roleUtilisateurRepository.save(existing))
                .thenReturn(existing);

        service.update(relationId, request);

        verifyNoInteractions(utilisateurRepository, roleRepository);
    }

    @Test
    void getById_ShouldReturnMappedRelation() {
        UUID id = UUID.randomUUID();
        RoleUtilisateur relation = new RoleUtilisateur();
        RoleUtilisateurResponseDto dto =
                mock(RoleUtilisateurResponseDto.class);

        when(roleUtilisateurRepository.findById(id))
                .thenReturn(Optional.of(relation));
        when(roleUtilisateurMapper.entityToResponse(relation))
                .thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getAll_ShouldMapAll() {
        when(roleUtilisateurRepository.findAll())
                .thenReturn(List.of(
                        new RoleUtilisateur(),
                        new RoleUtilisateur()
                ));
        when(roleUtilisateurMapper.entityToResponse(any()))
                .thenReturn(mock(RoleUtilisateurResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(roleUtilisateurRepository.existsById(id))
                .thenReturn(true);

        service.delete(id);

        verify(roleUtilisateurRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(roleUtilisateurRepository.existsById(id))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.delete(id)
        );
    }

    @Test
    void affecterRoleToUtilisateur_ShouldCreateRelation() {
        RoleUtilisateurResponseDto dto =
                mock(RoleUtilisateurResponseDto.class);

        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(roleRepository.findById(roleId))
                .thenReturn(Optional.of(role));
        when(roleUtilisateurRepository
                .existsByUtilisateurUtilisateurIdAndRoleRoleId(
                        userId,
                        roleId))
                .thenReturn(false);
        when(roleUtilisateurRepository.save(any(RoleUtilisateur.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(roleUtilisateurMapper.entityToResponse(any()))
                .thenReturn(dto);

        assertSame(
                dto,
                service.affecterRoleToUtilisateur(userId, roleId)
        );
    }

    @Test
    void affecterRoleToUtilisateur_ShouldRejectDuplicate() {
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(roleRepository.findById(roleId))
                .thenReturn(Optional.of(role));
        when(roleUtilisateurRepository
                .existsByUtilisateurUtilisateurIdAndRoleRoleId(
                        userId,
                        roleId))
                .thenReturn(true);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.affecterRoleToUtilisateur(
                        userId,
                        roleId
                )
        );
    }

    @Test
    void retirerRoleDeUtilisateur_ShouldDeleteRelation() {
        RoleUtilisateur relation = new RoleUtilisateur();

        when(roleUtilisateurRepository
                .findByUtilisateurUtilisateurIdAndRoleRoleId(
                        userId,
                        roleId))
                .thenReturn(Optional.of(relation));

        service.retirerRoleDeUtilisateur(userId, roleId);

        verify(roleUtilisateurRepository).delete(relation);
    }

    @Test
    void retirerRoleDeUtilisateur_ShouldThrow_WhenMissing() {
        when(roleUtilisateurRepository
                .findByUtilisateurUtilisateurIdAndRoleRoleId(
                        userId,
                        roleId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.retirerRoleDeUtilisateur(
                        userId,
                        roleId
                )
        );
    }
}
