package com.commercial.Pont.Commercial.services;


import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AbonnementMapperInterface;
import com.commercial.Pont.Commercial.models.Abonnement;
import com.commercial.Pont.Commercial.repositories.AbonnementRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.AbonnementServiceImpl;
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
class AbonnementServiceImplTest {

    @Mock
    private AbonnementRepository abonnementRepository;

    @Mock
    private AbonnementMapperInterface abonnementMapper;

    @InjectMocks
    private AbonnementServiceImpl abonnementService;

    private UUID abonnementId;

    private Abonnement abonnement;

    private AbonnementRequestDto requestDto;

    private AbonnementResponseDto responseDto;

    @BeforeEach
    void setUp() {

        abonnementId = UUID.randomUUID();

        abonnement = new Abonnement();

        requestDto = mock(AbonnementRequestDto.class);

        responseDto = mock(AbonnementResponseDto.class);
    }

    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateAbonnementSuccessfully() {

        when(abonnementMapper.requestToEntity(requestDto))
                .thenReturn(abonnement);

        when(abonnementRepository.save(abonnement))
                .thenReturn(abonnement);

        when(abonnementMapper.entityToResponse(abonnement))
                .thenReturn(responseDto);


        AbonnementResponseDto result =
                abonnementService.create(requestDto);


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );

        verify(abonnementMapper)
                .requestToEntity(requestDto);

        verify(abonnementRepository)
                .save(abonnement);

        verify(abonnementMapper)
                .entityToResponse(abonnement);
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnAbonnement_WhenAbonnementExists() {

        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));

        when(abonnementMapper.entityToResponse(abonnement))
                .thenReturn(responseDto);


        AbonnementResponseDto result =
                abonnementService.getById(abonnementId);


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );

        verify(abonnementRepository)
                .findById(abonnementId);

        verify(abonnementMapper)
                .entityToResponse(abonnement);
    }


    @Test
    void getById_ShouldThrowException_WhenAbonnementDoesNotExist() {

        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () -> abonnementService.getById(abonnementId)
                );


        assertTrue(
                exception.getMessage()
                        .contains(abonnementId.toString())
        );

        verify(abonnementRepository)
                .findById(abonnementId);

        verifyNoInteractions(abonnementMapper);
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllAbonnements() {

        Abonnement abonnement2 =
                new Abonnement();

        AbonnementResponseDto responseDto2 =
                mock(AbonnementResponseDto.class);


        when(abonnementRepository.findAll())
                .thenReturn(
                        List.of(
                                abonnement,
                                abonnement2
                        )
                );

        when(abonnementMapper.entityToResponse(abonnement))
                .thenReturn(responseDto);

        when(abonnementMapper.entityToResponse(abonnement2))
                .thenReturn(responseDto2);


        List<AbonnementResponseDto> result =
                abonnementService.getAll();


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

        verify(abonnementRepository)
                .findAll();

        verify(abonnementMapper, times(2))
                .entityToResponse(any(Abonnement.class));
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoAbonnementExists() {

        when(abonnementRepository.findAll())
                .thenReturn(List.of());


        List<AbonnementResponseDto> result =
                abonnementService.getAll();


        assertNotNull(result);

        assertTrue(result.isEmpty());

        verify(abonnementRepository)
                .findAll();

        verifyNoInteractions(abonnementMapper);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateAbonnementSuccessfully() {

        /*
         * Nous mockons directement les getters du DTO.
         * Cela évite de dépendre de son constructeur.
         */

        when(requestDto.getNom())
                .thenReturn("Premium");

        when(requestDto.getDureeEnMois())
                .thenReturn(12);


        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));

        when(abonnementRepository.save(abonnement))
                .thenReturn(abonnement);

        when(abonnementMapper.entityToResponse(abonnement))
                .thenReturn(responseDto);


        AbonnementResponseDto result =
                abonnementService.update(
                        abonnementId,
                        requestDto
                );


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );

        assertEquals(
                "Premium",
                abonnement.getNom()
        );

        assertEquals(
                12,
                abonnement.getDureeEnMois()
        );

        assertNotNull(
                abonnement.getUpdatedAt()
        );


        verify(abonnementRepository)
                .findById(abonnementId);

        verify(abonnementRepository)
                .save(abonnement);

        verify(abonnementMapper)
                .entityToResponse(abonnement);
    }


    @Test
    void update_ShouldThrowException_WhenAbonnementDoesNotExist() {

        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.empty());


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        abonnementService.update(
                                abonnementId,
                                requestDto
                        )
        );


        verify(abonnementRepository)
                .findById(abonnementId);

        verify(abonnementRepository, never())
                .save(any());

        verifyNoInteractions(abonnementMapper);
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteAbonnement_WhenAbonnementExists() {

        when(abonnementRepository.existsById(abonnementId))
                .thenReturn(true);


        abonnementService.delete(abonnementId);


        verify(abonnementRepository)
                .existsById(abonnementId);

        verify(abonnementRepository)
                .deleteById(abonnementId);
    }


    @Test
    void delete_ShouldThrowException_WhenAbonnementDoesNotExist() {

        when(abonnementRepository.existsById(abonnementId))
                .thenReturn(false);


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () -> abonnementService.delete(abonnementId)
                );


        assertTrue(
                exception.getMessage()
                        .contains(abonnementId.toString())
        );

        verify(abonnementRepository)
                .existsById(abonnementId);

        verify(abonnementRepository, never())
                .deleteById(any());
    }
}