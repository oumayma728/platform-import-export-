package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.FacturationMapperInterface;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.FacturationServiceImpl;
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
class FacturationServiceImplTest {

    @Mock
    private FacturationRepository facturationRepository;

    @Mock
    private FacturationMapperInterface facturationMapper;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private FacturationServiceImpl facturationService;


    private UUID facturationId;
    private UUID subscriptionId;

    private Facturation facturation;
    private Subscription subscription;

    private FacturationRequestDto requestDto;
    private FacturationResponseDto responseDto;


    @BeforeEach
    void setUp() {

        facturationId =
                UUID.randomUUID();

        subscriptionId =
                UUID.randomUUID();

        facturation =
                new Facturation();

        subscription =
                new Subscription();

        subscription.setSubscriptionId(
                subscriptionId
        );

        requestDto =
                mock(FacturationRequestDto.class);

        responseDto =
                mock(FacturationResponseDto.class);
    }


    // =========================================================
    // CREATE AVEC SUBSCRIPTION
    // =========================================================

    @Test
    void create_ShouldCreateFacturationWithSubscription() {

        when(requestDto.getSubscriptionId())
                .thenReturn(subscriptionId);

        when(facturationMapper.requestToEntity(requestDto))
                .thenReturn(facturation);

        when(subscriptionRepository.findById(subscriptionId))
                .thenReturn(
                        Optional.of(subscription)
                );

        when(facturationRepository.save(facturation))
                .thenReturn(facturation);

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);


        FacturationResponseDto result =
                facturationService.create(
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertSame(
                subscription,
                facturation.getSubscription()
        );

        assertNotNull(
                facturation.getCreatedAt()
        );

        assertNotNull(
                facturation.getUpdatedAt()
        );


        verify(subscriptionRepository)
                .findById(subscriptionId);

        verify(facturationRepository)
                .save(facturation);
    }


    // =========================================================
    // CREATE SANS SUBSCRIPTION
    // =========================================================

    @Test
    void create_ShouldCreateFacturationWithoutSubscription() {

        when(requestDto.getSubscriptionId())
                .thenReturn(null);

        when(facturationMapper.requestToEntity(requestDto))
                .thenReturn(facturation);

        when(facturationRepository.save(facturation))
                .thenReturn(facturation);

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);


        FacturationResponseDto result =
                facturationService.create(
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertNull(
                facturation.getSubscription()
        );

        assertNotNull(
                facturation.getCreatedAt()
        );

        assertNotNull(
                facturation.getUpdatedAt()
        );


        verifyNoInteractions(
                subscriptionRepository
        );

        verify(facturationRepository)
                .save(facturation);
    }


    // =========================================================
    // CREATE SUBSCRIPTION INTROUVABLE
    // =========================================================

    @Test
    void create_ShouldThrowException_WhenSubscriptionDoesNotExist() {

        when(requestDto.getSubscriptionId())
                .thenReturn(subscriptionId);

        when(facturationMapper.requestToEntity(requestDto))
                .thenReturn(facturation);

        when(subscriptionRepository.findById(subscriptionId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                facturationService.create(
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(subscriptionId.toString())
        );

        verify(facturationRepository, never())
                .save(any());
    }


    // =========================================================
    // UPDATE SANS CHANGEMENT DE SUBSCRIPTION
    // =========================================================

    @Test
    void update_ShouldUpdateWithoutChangingSubscription() {

        facturation.setSubscription(
                subscription
        );

        LocalDateTime oldUpdatedAt =
                LocalDateTime.now()
                        .minusHours(2);

        facturation.setUpdatedAt(
                oldUpdatedAt
        );


        when(requestDto.getNumeroFacture())
                .thenReturn("FACT-001");

        when(requestDto.getStatut())
                .thenReturn(
                        FacturationStatus.LIMITE_ATTEINTE
                );

        when(requestDto.getSubscriptionId())
                .thenReturn(subscriptionId);


        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.of(facturation)
                );

        when(facturationRepository.save(facturation))
                .thenReturn(facturation);

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);


        FacturationResponseDto result =
                facturationService.update(
                        facturationId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertEquals(
                "FACT-001",
                facturation.getNumeroFacture()
        );

        assertEquals(
                FacturationStatus.LIMITE_ATTEINTE,
                facturation.getStatut()
        );

        assertSame(
                subscription,
                facturation.getSubscription()
        );

        assertTrue(
                facturation.getUpdatedAt()
                        .isAfter(oldUpdatedAt)
        );


        /*
         * Même subscription :
         * aucune nouvelle recherche.
         */
        verify(subscriptionRepository, never())
                .findById(any());

        verify(facturationRepository)
                .save(facturation);
    }


    // =========================================================
    // UPDATE AVEC NOUVELLE SUBSCRIPTION
    // =========================================================

    @Test
    void update_ShouldChangeSubscription_WhenSubscriptionChanged() {

        UUID newSubscriptionId =
                UUID.randomUUID();

        Subscription newSubscription =
                new Subscription();

        newSubscription.setSubscriptionId(
                newSubscriptionId
        );


        facturation.setSubscription(
                subscription
        );


        when(requestDto.getSubscriptionId())
                .thenReturn(newSubscriptionId);

        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.of(facturation)
                );

        when(subscriptionRepository.findById(newSubscriptionId))
                .thenReturn(
                        Optional.of(newSubscription)
                );

        when(facturationRepository.save(facturation))
                .thenReturn(facturation);

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);


        FacturationResponseDto result =
                facturationService.update(
                        facturationId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertSame(
                newSubscription,
                facturation.getSubscription()
        );


        verify(subscriptionRepository)
                .findById(newSubscriptionId);

        verify(facturationRepository)
                .save(facturation);
    }


    // =========================================================
    // UPDATE : FACTURATION N'A PAS ENCORE DE SUBSCRIPTION
    // =========================================================

    @Test
    void update_ShouldAssignSubscription_WhenExistingSubscriptionIsNull() {

        facturation.setSubscription(
                null
        );


        when(requestDto.getSubscriptionId())
                .thenReturn(subscriptionId);

        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.of(facturation)
                );

        when(subscriptionRepository.findById(subscriptionId))
                .thenReturn(
                        Optional.of(subscription)
                );

        when(facturationRepository.save(facturation))
                .thenReturn(facturation);

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);


        FacturationResponseDto result =
                facturationService.update(
                        facturationId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertSame(
                subscription,
                facturation.getSubscription()
        );


        verify(subscriptionRepository)
                .findById(subscriptionId);
    }


    // =========================================================
    // UPDATE NOUVELLE SUBSCRIPTION INTROUVABLE
    // =========================================================

    @Test
    void update_ShouldThrowException_WhenNewSubscriptionDoesNotExist() {

        UUID newSubscriptionId =
                UUID.randomUUID();

        facturation.setSubscription(
                subscription
        );


        when(requestDto.getSubscriptionId())
                .thenReturn(newSubscriptionId);

        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.of(facturation)
                );

        when(subscriptionRepository.findById(newSubscriptionId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                facturationService.update(
                                        facturationId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(newSubscriptionId.toString())
        );

        verify(facturationRepository, never())
                .save(any());
    }


    // =========================================================
    // UPDATE FACTURATION INTROUVABLE
    // =========================================================

    @Test
    void update_ShouldThrowException_WhenFacturationDoesNotExist() {

        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                facturationService.update(
                                        facturationId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(facturationId.toString())
        );

        verify(facturationRepository, never())
                .save(any());

        verifyNoInteractions(
                subscriptionRepository
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnFacturation_WhenExists() {

        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.of(facturation)
                );

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);


        FacturationResponseDto result =
                facturationService.getById(
                        facturationId
                );


        assertSame(
                responseDto,
                result
        );

        verify(facturationRepository)
                .findById(facturationId);

        verify(facturationMapper)
                .entityToResponse(facturation);
    }


    @Test
    void getById_ShouldThrowException_WhenFacturationDoesNotExist() {

        when(facturationRepository.findById(facturationId))
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        facturationService.getById(
                                facturationId
                        )
        );


        verifyNoInteractions(
                facturationMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllFacturations() {

        Facturation facturation2 =
                new Facturation();

        FacturationResponseDto responseDto2 =
                mock(FacturationResponseDto.class);


        when(facturationRepository.findAll())
                .thenReturn(
                        List.of(
                                facturation,
                                facturation2
                        )
                );

        when(facturationMapper.entityToResponse(facturation))
                .thenReturn(responseDto);

        when(facturationMapper.entityToResponse(facturation2))
                .thenReturn(responseDto2);


        List<FacturationResponseDto> result =
                facturationService.getAll();


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

        verify(facturationMapper, times(2))
                .entityToResponse(
                        any(Facturation.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList() {

        when(facturationRepository.findAll())
                .thenReturn(
                        List.of()
                );


        List<FacturationResponseDto> result =
                facturationService.getAll();


        assertNotNull(result);
        assertTrue(result.isEmpty());

        verifyNoInteractions(
                facturationMapper
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteFacturation_WhenExists() {

        when(facturationRepository.existsById(facturationId))
                .thenReturn(true);


        facturationService.delete(
                facturationId
        );


        verify(facturationRepository)
                .existsById(facturationId);

        verify(facturationRepository)
                .deleteById(facturationId);
    }


    @Test
    void delete_ShouldThrowException_WhenFacturationDoesNotExist() {

        when(facturationRepository.existsById(facturationId))
                .thenReturn(false);


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        facturationService.delete(
                                facturationId
                        )
        );


        verify(facturationRepository, never())
                .deleteById(any());
    }


    // =========================================================
    // METTRE FACTURATION LIMITE ATTEINTE
    // =========================================================

    @Test
    void mettreFacturationLimiteAtteinte_ShouldUpdateFacturation_WhenFound() {

        UUID utilisateurId =
                UUID.randomUUID();

        Utilisateur utilisateur =
                new Utilisateur();

        utilisateur.setUtilisateurId(
                utilisateurId
        );


        LocalDateTime oldUpdatedAt =
                LocalDateTime.now()
                        .minusDays(1);

        facturation.setUpdatedAt(
                oldUpdatedAt
        );


        when(
                facturationRepository
                        .findFirstByUtilisateurUtilisateurIdAndTypeNotOrderByCreatedAtDesc(
                                utilisateurId,
                                FacturationType.ABONNEMENT
                        )
        )
                .thenReturn(
                        Optional.of(facturation)
                );


        facturationService
                .mettreFacturationLimiteAtteinte(
                        utilisateur
                );


        assertEquals(
                FacturationStatus.LIMITE_ATTEINTE,
                facturation.getStatut()
        );

        assertNotNull(
                facturation.getUpdatedAt()
        );

        assertTrue(
                facturation.getUpdatedAt()
                        .isAfter(oldUpdatedAt)
        );


        verify(facturationRepository)
                .save(facturation);
    }


    @Test
    void mettreFacturationLimiteAtteinte_ShouldDoNothing_WhenNoFacturationExists() {

        UUID utilisateurId =
                UUID.randomUUID();

        Utilisateur utilisateur =
                new Utilisateur();

        utilisateur.setUtilisateurId(
                utilisateurId
        );


        when(
                facturationRepository
                        .findFirstByUtilisateurUtilisateurIdAndTypeNotOrderByCreatedAtDesc(
                                utilisateurId,
                                FacturationType.ABONNEMENT
                        )
        )
                .thenReturn(
                        Optional.empty()
                );


        assertDoesNotThrow(
                () ->
                        facturationService
                                .mettreFacturationLimiteAtteinte(
                                        utilisateur
                                )
        );


        verify(facturationRepository, never())
                .save(any());
    }
}