package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.RoleMapperInterface;
import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.repositories.RoleRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.RoleServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RoleMapperInterface roleMapper;

    @InjectMocks
    private RoleServiceImpl roleService;


    private UUID roleId;

    private Role role;

    private RoleRequestDto requestDto;

    private RoleResponseDto responseDto;


    @BeforeEach
    void setUp() {

        roleId = UUID.randomUUID();

        role = new Role();

        requestDto =
                mock(RoleRequestDto.class);

        responseDto =
                mock(RoleResponseDto.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateRoleSuccessfully() {

        when(roleMapper.requestToEntity(requestDto))
                .thenReturn(role);

        when(roleRepository.save(role))
                .thenReturn(role);

        when(roleMapper.entityToResponse(role))
                .thenReturn(responseDto);


        RoleResponseDto result =
                roleService.create(requestDto);


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );

        assertNotNull(
                role.getCreatedAt()
        );

        assertNotNull(
                role.getUpdatedAt()
        );


        /*
         * Les deux dates sont créées
         * avec la même variable now.
         */
        assertEquals(
                role.getCreatedAt(),
                role.getUpdatedAt()
        );


        verify(roleMapper)
                .requestToEntity(requestDto);

        verify(roleRepository)
                .save(role);

        verify(roleMapper)
                .entityToResponse(role);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateRoleSuccessfully() {

        LocalDateTime createdAt =
                LocalDateTime.now()
                        .minusDays(10);

        LocalDateTime oldUpdatedAt =
                LocalDateTime.now()
                        .minusDays(1);


        role.setCreatedAt(
                createdAt
        );

        role.setUpdatedAt(
                oldUpdatedAt
        );


        when(requestDto.getCode())
                .thenReturn("ADMIN");

        when(requestDto.getNom())
                .thenReturn("Administrateur");

        when(requestDto.getDescription())
                .thenReturn(
                        "Administrateur de la plateforme"
                );


        when(roleRepository.findById(roleId))
                .thenReturn(
                        Optional.of(role)
                );

        when(roleRepository.save(role))
                .thenReturn(role);

        when(roleMapper.entityToResponse(role))
                .thenReturn(responseDto);


        RoleResponseDto result =
                roleService.update(
                        roleId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                "ADMIN",
                role.getCode()
        );

        assertEquals(
                "Administrateur",
                role.getNom()
        );

        assertEquals(
                "Administrateur de la plateforme",
                role.getDescription()
        );


        /*
         * createdAt ne doit pas changer.
         */
        assertEquals(
                createdAt,
                role.getCreatedAt()
        );


        /*
         * updatedAt doit être rafraîchi.
         */
        assertNotNull(
                role.getUpdatedAt()
        );

        assertTrue(
                role.getUpdatedAt()
                        .isAfter(oldUpdatedAt)
        );


        verify(roleRepository)
                .findById(roleId);

        verify(roleRepository)
                .save(role);

        verify(roleMapper)
                .entityToResponse(role);
    }


    @Test
    void update_ShouldThrowEntityNotFoundException_WhenRoleDoesNotExist() {

        when(roleRepository.findById(roleId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                roleService.update(
                                        roleId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(roleId.toString())
        );


        verify(roleRepository)
                .findById(roleId);

        verify(roleRepository, never())
                .save(any());

        verifyNoInteractions(
                roleMapper
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnRole_WhenRoleExists() {

        when(roleRepository.findById(roleId))
                .thenReturn(
                        Optional.of(role)
                );

        when(roleMapper.entityToResponse(role))
                .thenReturn(responseDto);


        RoleResponseDto result =
                roleService.getById(
                        roleId
                );


        assertSame(
                responseDto,
                result
        );


        verify(roleRepository)
                .findById(roleId);

        verify(roleMapper)
                .entityToResponse(role);
    }


    @Test
    void getById_ShouldThrowEntityNotFoundException_WhenRoleDoesNotExist() {

        when(roleRepository.findById(roleId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                roleService.getById(
                                        roleId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(roleId.toString())
        );


        verify(roleRepository)
                .findById(roleId);

        verifyNoInteractions(
                roleMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllRoles() {

        Role role2 =
                new Role();

        RoleResponseDto responseDto2 =
                mock(RoleResponseDto.class);


        when(roleRepository.findAll())
                .thenReturn(
                        List.of(
                                role,
                                role2
                        )
                );


        when(roleMapper.entityToResponse(role))
                .thenReturn(responseDto);

        when(roleMapper.entityToResponse(role2))
                .thenReturn(responseDto2);


        List<RoleResponseDto> result =
                roleService.getAll();


        assertNotNull(result);

        assertEquals(
                2,
                result.size()
        );

        assertSame(
                responseDto,
                result.get(0)
        );

        assertSame(
                responseDto2,
                result.get(1)
        );


        verify(roleRepository)
                .findAll();

        verify(roleMapper, times(2))
                .entityToResponse(
                        any(Role.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoRoleExists() {

        when(roleRepository.findAll())
                .thenReturn(
                        List.of()
                );


        List<RoleResponseDto> result =
                roleService.getAll();


        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );


        verify(roleRepository)
                .findAll();

        verifyNoInteractions(
                roleMapper
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteRoleSuccessfully() {

        when(roleRepository.existsById(roleId))
                .thenReturn(true);


        roleService.delete(
                roleId
        );


        verify(roleRepository)
                .existsById(roleId);

        verify(roleRepository)
                .deleteById(roleId);
    }


    @Test
    void delete_ShouldThrowEntityNotFoundException_WhenRoleDoesNotExist() {

        when(roleRepository.existsById(roleId))
                .thenReturn(false);


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                roleService.delete(
                                        roleId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(roleId.toString())
        );


        verify(roleRepository)
                .existsById(roleId);

        verify(roleRepository, never())
                .deleteById(any());
    }
}