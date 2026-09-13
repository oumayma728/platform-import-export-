package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.AnnonceServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnonceServiceTest {

    @Mock
    private AnnonceRepository annonceRepository;

    @Mock
    private AnnonceMapperInterface annonceMapper;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private CurrencyConversionServiceInterface currencyConversionService;

    @InjectMocks
    private AnnonceServiceImpl annonceService;


    // ==========================================================
    // TEST 1
    // CREATE ANNONCE SUCCESS
    // ==========================================================

    @Test
    void test_create_listing_success() {

        // ARRANGE

        AnnonceRequestDto request =
                new AnnonceRequestDto();

        Annonce annonce =
                new Annonce();

        Annonce savedAnnonce =
                new Annonce();

        AnnonceResponseDto expectedResponse =
                AnnonceResponseDto.builder()
                        .titre("Produit test")
                        .build();


        when(
                annonceMapper.requestToEntity(request)
        ).thenReturn(
                annonce
        );


        when(
                annonceRepository.save(annonce)
        ).thenReturn(
                savedAnnonce
        );


        when(
                annonceMapper.entityToResponse(savedAnnonce)
        ).thenReturn(
                expectedResponse
        );


        // ACT

        AnnonceResponseDto result =
                annonceService.create(request);


        // ASSERT

        assertNotNull(result);

        assertSame(
                expectedResponse,
                result
        );


        assertNotNull(
                annonce.getCreatedAt()
        );

        assertNotNull(
                annonce.getUpdatedAt()
        );


        verify(
                annonceMapper,
                times(1)
        ).requestToEntity(
                request
        );


        verify(
                annonceRepository,
                times(1)
        ).save(
                annonce
        );


        verify(
                annonceMapper,
                times(1)
        ).entityToResponse(
                savedAnnonce
        );


        verifyNoInteractions(
                utilisateurRepository
        );

        verifyNoInteractions(
                currencyConversionService
        );
    }


    // ==========================================================
    // TEST 2
    // CREATED AT ET UPDATED AT SONT INITIALISES
    // ==========================================================

    @Test
    void test_create_listing_should_initialize_dates() {

        // ARRANGE

        AnnonceRequestDto request =
                new AnnonceRequestDto();

        Annonce annonce =
                new Annonce();

        Annonce savedAnnonce =
                new Annonce();

        AnnonceResponseDto response =
                AnnonceResponseDto.builder()
                        .titre("Annonce")
                        .build();


        LocalDateTime before =
                LocalDateTime.now();


        when(
                annonceMapper.requestToEntity(request)
        ).thenReturn(
                annonce
        );


        when(
                annonceRepository.save(annonce)
        ).thenReturn(
                savedAnnonce
        );


        when(
                annonceMapper.entityToResponse(savedAnnonce)
        ).thenReturn(
                response
        );


        // ACT

        annonceService.create(request);


        LocalDateTime after =
                LocalDateTime.now();


        // ASSERT

        assertNotNull(
                annonce.getCreatedAt()
        );

        assertNotNull(
                annonce.getUpdatedAt()
        );


        assertFalse(
                annonce.getCreatedAt()
                        .isBefore(before)
        );

        assertFalse(
                annonce.getCreatedAt()
                        .isAfter(after)
        );


        assertFalse(
                annonce.getUpdatedAt()
                        .isBefore(before)
        );

        assertFalse(
                annonce.getUpdatedAt()
                        .isAfter(after)
        );
    }


    // ==========================================================
    // TEST 3
    // ERREUR MAPPER
    // ==========================================================

    @Test
    void test_create_listing_mapper_failure() {

        // ARRANGE

        AnnonceRequestDto request =
                new AnnonceRequestDto();


        when(
                annonceMapper.requestToEntity(request)
        ).thenThrow(
                new RuntimeException(
                        "Mapper error"
                )
        );


        // ACT + ASSERT

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () ->
                                annonceService.create(
                                        request
                                )
                );


        assertEquals(
                "Mapper error",
                exception.getMessage()
        );


        verify(
                annonceMapper,
                times(1)
        ).requestToEntity(
                request
        );


        verifyNoInteractions(
                annonceRepository
        );
    }


    // ==========================================================
    // TEST 4
    // ERREUR DATABASE
    // ==========================================================

    @Test
    void test_create_listing_database_failure() {

        // ARRANGE

        AnnonceRequestDto request =
                new AnnonceRequestDto();

        Annonce annonce =
                new Annonce();


        when(
                annonceMapper.requestToEntity(request)
        ).thenReturn(
                annonce
        );


        when(
                annonceRepository.save(annonce)
        ).thenThrow(
                new RuntimeException(
                        "Database error"
                )
        );


        // ACT + ASSERT

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () ->
                                annonceService.create(
                                        request
                                )
                );


        assertEquals(
                "Database error",
                exception.getMessage()
        );


        verify(
                annonceRepository,
                times(1)
        ).save(
                annonce
        );


        verify(
                annonceMapper,
                never()
        ).entityToResponse(
                any()
        );
    }


    // ==========================================================
    // TEST 5
    // ENTITY SAUVEE = ENTITY PRODUITE PAR MAPPER
    // ==========================================================

    @Test
    void test_create_listing_should_save_mapped_entity() {

        AnnonceRequestDto request =
                new AnnonceRequestDto();

        Annonce mappedAnnonce =
                new Annonce();

        Annonce savedAnnonce =
                new Annonce();

        AnnonceResponseDto response =
                AnnonceResponseDto.builder()
                        .titre("Test")
                        .build();


        when(
                annonceMapper.requestToEntity(request)
        ).thenReturn(
                mappedAnnonce
        );


        when(
                annonceRepository.save(mappedAnnonce)
        ).thenReturn(
                savedAnnonce
        );


        when(
                annonceMapper.entityToResponse(savedAnnonce)
        ).thenReturn(
                response
        );


        // ACT

        annonceService.create(
                request
        );


        // ASSERT

        verify(
                annonceRepository
        ).save(
                same(mappedAnnonce)
        );
    }
}