package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.PaiementMapperInterface;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.repositories.PaiementRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.PaiementServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaiementServiceImplTest {

    @Mock
    private PaiementRepository paiementRepository;

    @Mock
    private PaiementMapperInterface paiementMapper;

    @InjectMocks
    private PaiementServiceImpl paiementService;


    private UUID paiementId;

    private Paiement paiement;

    private PaiementRequestDto requestDto;

    private PaiementResponseDto responseDto;


    @BeforeEach
    void setUp() {

        paiementId =
                UUID.randomUUID();

        paiement =
                new Paiement();

        requestDto =
                mock(PaiementRequestDto.class);

        responseDto =
                mock(PaiementResponseDto.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreatePaiementSuccessfully() {

        when(paiementMapper.requestToEntity(requestDto))
                .thenReturn(paiement);

        when(paiementRepository.save(paiement))
                .thenReturn(paiement);

        when(paiementMapper.entityToResponse(paiement))
                .thenReturn(responseDto);


        PaiementResponseDto result =
                paiementService.create(
                        requestDto
                );


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );


        assertNotNull(
                paiement.getCreatedAt()
        );

        assertNotNull(
                paiement.getUpdatedAt()
        );


        /*
         * Comme datePaiement était null,
         * elle doit être créée automatiquement.
         */
        assertNotNull(
                paiement.getDatePaiement()
        );


        verify(paiementMapper)
                .requestToEntity(requestDto);

        verify(paiementRepository)
                .save(paiement);

        verify(paiementMapper)
                .entityToResponse(paiement);
    }


    @Test
    void create_ShouldKeepExistingDatePaiement() {

        LocalDateTime existingDate =
                LocalDateTime.of(
                        2026,
                        8,
                        20,
                        15,
                        30
                );

        paiement.setDatePaiement(
                existingDate
        );


        when(paiementMapper.requestToEntity(requestDto))
                .thenReturn(paiement);

        when(paiementRepository.save(paiement))
                .thenReturn(paiement);

        when(paiementMapper.entityToResponse(paiement))
                .thenReturn(responseDto);


        paiementService.create(
                requestDto
        );


        assertEquals(
                existingDate,
                paiement.getDatePaiement()
        );


        assertNotNull(
                paiement.getCreatedAt()
        );

        assertNotNull(
                paiement.getUpdatedAt()
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdatePaiementSuccessfully() {

        BigDecimal montant =
                new BigDecimal("150.50");

        LocalDateTime datePaiement =
                LocalDateTime.of(
                        2026,
                        9,
                        10,
                        14,
                        30
                );


        LocalDateTime oldUpdatedAt =
                LocalDateTime.now()
                        .minusDays(1);

        paiement.setUpdatedAt(
                oldUpdatedAt
        );


        when(requestDto.getMontant())
                .thenReturn(montant);

        when(requestDto.getDevise())
                .thenReturn("USD");

        when(requestDto.getStripePaymentIntentId())
                .thenReturn("pi_test_123");

        when(requestDto.getStripeChargeId())
                .thenReturn("ch_test_123");

        when(requestDto.getDatePaiement())
                .thenReturn(datePaiement);

        when(requestDto.getMessageErreur())
                .thenReturn(null);


        when(paiementRepository.findById(paiementId))
                .thenReturn(
                        Optional.of(paiement)
                );

        when(paiementRepository.save(paiement))
                .thenReturn(paiement);

        when(paiementMapper.entityToResponse(paiement))
                .thenReturn(responseDto);


        PaiementResponseDto result =
                paiementService.update(
                        paiementId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                montant,
                paiement.getMontant()
        );

        assertEquals(
                "USD",
                paiement.getDevise()
        );

        assertEquals(
                "pi_test_123",
                paiement.getStripePaymentIntentId()
        );

        assertEquals(
                "ch_test_123",
                paiement.getStripeChargeId()
        );

        assertEquals(
                datePaiement,
                paiement.getDatePaiement()
        );

        assertNull(
                paiement.getMessageErreur()
        );


        assertNotNull(
                paiement.getUpdatedAt()
        );

        assertTrue(
                paiement.getUpdatedAt()
                        .isAfter(oldUpdatedAt)
        );


        verify(paiementRepository)
                .findById(paiementId);

        verify(paiementRepository)
                .save(paiement);

        verify(paiementMapper)
                .entityToResponse(paiement);
    }


    @Test
    void update_ShouldThrowEntityNotFoundException_WhenPaiementDoesNotExist() {

        when(paiementRepository.findById(paiementId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                paiementService.update(
                                        paiementId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(paiementId.toString())
        );


        verify(paiementRepository)
                .findById(paiementId);

        verify(paiementRepository, never())
                .save(any());

        verifyNoInteractions(
                paiementMapper
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnPaiement_WhenPaiementExists() {

        when(paiementRepository.findById(paiementId))
                .thenReturn(
                        Optional.of(paiement)
                );

        when(paiementMapper.entityToResponse(paiement))
                .thenReturn(responseDto);


        PaiementResponseDto result =
                paiementService.getById(
                        paiementId
                );


        assertSame(
                responseDto,
                result
        );


        verify(paiementRepository)
                .findById(paiementId);

        verify(paiementMapper)
                .entityToResponse(paiement);
    }


    @Test
    void getById_ShouldThrowEntityNotFoundException_WhenPaiementDoesNotExist() {

        when(paiementRepository.findById(paiementId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                paiementService.getById(
                                        paiementId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(paiementId.toString())
        );


        verify(paiementRepository)
                .findById(paiementId);

        verifyNoInteractions(
                paiementMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllPaiements() {

        Paiement paiement2 =
                new Paiement();

        PaiementResponseDto responseDto2 =
                mock(PaiementResponseDto.class);


        when(paiementRepository.findAll())
                .thenReturn(
                        List.of(
                                paiement,
                                paiement2
                        )
                );


        when(paiementMapper.entityToResponse(paiement))
                .thenReturn(responseDto);

        when(paiementMapper.entityToResponse(paiement2))
                .thenReturn(responseDto2);


        List<PaiementResponseDto> result =
                paiementService.getAll();


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


        verify(paiementRepository)
                .findAll();

        verify(paiementMapper, times(2))
                .entityToResponse(
                        any(Paiement.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoPaiementExists() {

        when(paiementRepository.findAll())
                .thenReturn(
                        List.of()
                );


        List<PaiementResponseDto> result =
                paiementService.getAll();


        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );


        verify(paiementRepository)
                .findAll();

        verifyNoInteractions(
                paiementMapper
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeletePaiementSuccessfully() {

        when(paiementRepository.existsById(paiementId))
                .thenReturn(true);


        paiementService.delete(
                paiementId
        );


        verify(paiementRepository)
                .existsById(paiementId);

        verify(paiementRepository)
                .deleteById(paiementId);
    }


    @Test
    void delete_ShouldThrowEntityNotFoundException_WhenPaiementDoesNotExist() {

        when(paiementRepository.existsById(paiementId))
                .thenReturn(false);


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                paiementService.delete(
                                        paiementId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(paiementId.toString())
        );


        verify(paiementRepository)
                .existsById(paiementId);

        verify(paiementRepository, never())
                .deleteById(any());
    }
}