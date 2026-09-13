package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreateSubscriptionResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.enums.PaiementStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.SubscriptionMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ImplementationServices.SubscriptionServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeError;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceImplTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionMapperInterface subscriptionMapper;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private AbonnementRepository abonnementRepository;
    @Mock private FacturationRepository facturationRepository;
    @Mock private PaiementRepository paiementRepository;
    @Mock private NotificationServiceInterface notificationService;
    @Mock private Authentication authentication;

    @InjectMocks
    private SubscriptionServiceImpl service;

    private UUID userId;
    private UUID abonnementId;
    private Utilisateur utilisateur;
    private Abonnement abonnement;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        abonnementId = UUID.randomUUID();

        utilisateur = new Utilisateur();
        utilisateur.setUtilisateurId(userId);

        abonnement = new Abonnement();
        abonnement.setAbonnementId(abonnementId);
        abonnement.setNom("Premium");
        abonnement.setStatut(AbonnementStatus.ACTIVE);
        abonnement.setDureeEnMois(12);
        abonnement.setMontant(new BigDecimal("99.90"));
        abonnement.setDevise("MAD");
    }

    @Test
    void create_ShouldCreateSubscriptionSuccessfully() {
        SubscriptionRequestDto request = mock(SubscriptionRequestDto.class);
        Subscription subscription = new Subscription();
        SubscriptionResponseDto response = mock(SubscriptionResponseDto.class);

        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getAbonnementId()).thenReturn(abonnementId);
        when(request.getFacturationId()).thenReturn(null);
        when(subscriptionMapper.requestToEntity(request))
                .thenReturn(subscription);
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));
        when(subscriptionRepository.save(subscription))
                .thenReturn(subscription);
        when(subscriptionMapper.entityToResponse(subscription))
                .thenReturn(response);

        assertSame(response, service.create(request));
        assertSame(utilisateur, subscription.getUtilisateur());
        assertSame(abonnement, subscription.getAbonnement());
        assertNotNull(subscription.getDateDebut());
    }

    @Test
    void create_ShouldAssociateOptionalFacturation() {
        UUID facturationId = UUID.randomUUID();
        Facturation facturation = new Facturation();

        SubscriptionRequestDto request = mock(SubscriptionRequestDto.class);
        Subscription subscription = new Subscription();

        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getAbonnementId()).thenReturn(abonnementId);
        when(request.getFacturationId()).thenReturn(facturationId);
        when(subscriptionMapper.requestToEntity(request))
                .thenReturn(subscription);
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));
        when(facturationRepository.findById(facturationId))
                .thenReturn(Optional.of(facturation));
        when(subscriptionRepository.save(subscription))
                .thenReturn(subscription);

        service.create(request);

        assertSame(facturation, subscription.getFacturation());
    }

    @Test
    void create_ShouldThrow_WhenUserMissing() {
        SubscriptionRequestDto request = mock(SubscriptionRequestDto.class);
        when(request.getUtilisateurId()).thenReturn(userId);
        when(subscriptionMapper.requestToEntity(request))
                .thenReturn(new Subscription());
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void create_ShouldThrow_WhenAbonnementMissing() {
        SubscriptionRequestDto request = mock(SubscriptionRequestDto.class);
        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getAbonnementId()).thenReturn(abonnementId);
        when(subscriptionMapper.requestToEntity(request))
                .thenReturn(new Subscription());
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void update_ShouldUpdateRelations_WhenIdsChange() {
        UUID subscriptionId = UUID.randomUUID();
        UUID newUserId = UUID.randomUUID();
        UUID newAbonnementId = UUID.randomUUID();
        UUID facturationId = UUID.randomUUID();

        Utilisateur newUser = new Utilisateur();
        newUser.setUtilisateurId(newUserId);

        Abonnement newAbonnement = new Abonnement();
        newAbonnement.setAbonnementId(newAbonnementId);

        Facturation facturation = new Facturation();
        facturation.setFacturationId(facturationId);

        Subscription existing = new Subscription();
        existing.setUtilisateur(utilisateur);
        existing.setAbonnement(abonnement);

        SubscriptionRequestDto request = mock(SubscriptionRequestDto.class);
        when(request.getUtilisateurId()).thenReturn(newUserId);
        when(request.getAbonnementId()).thenReturn(newAbonnementId);
        when(request.getFacturationId()).thenReturn(facturationId);
        when(request.getDateDebut()).thenReturn(LocalDateTime.now());
        when(subscriptionRepository.findById(subscriptionId))
                .thenReturn(Optional.of(existing));
        when(utilisateurRepository.findById(newUserId))
                .thenReturn(Optional.of(newUser));
        when(abonnementRepository.findById(newAbonnementId))
                .thenReturn(Optional.of(newAbonnement));
        when(facturationRepository.findById(facturationId))
                .thenReturn(Optional.of(facturation));
        when(subscriptionRepository.save(existing))
                .thenReturn(existing);

        service.update(subscriptionId, request);

        assertSame(newUser, existing.getUtilisateur());
        assertSame(newAbonnement, existing.getAbonnement());
        assertSame(facturation, existing.getFacturation());
    }

    @Test
    void update_ShouldNotReloadSameRelations() {
        UUID subscriptionId = UUID.randomUUID();

        Subscription existing = new Subscription();
        existing.setUtilisateur(utilisateur);
        existing.setAbonnement(abonnement);

        SubscriptionRequestDto request = mock(SubscriptionRequestDto.class);
        when(request.getUtilisateurId()).thenReturn(userId);
        when(request.getAbonnementId()).thenReturn(abonnementId);
        when(request.getFacturationId()).thenReturn(null);
        when(subscriptionRepository.findById(subscriptionId))
                .thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(existing))
                .thenReturn(existing);

        service.update(subscriptionId, request);

        verifyNoInteractions(
                utilisateurRepository,
                abonnementRepository,
                facturationRepository
        );
    }

    @Test
    void getById_ShouldReturnMappedSubscription() {
        UUID id = UUID.randomUUID();
        Subscription subscription = new Subscription();
        SubscriptionResponseDto response = mock(SubscriptionResponseDto.class);

        when(subscriptionRepository.findById(id))
                .thenReturn(Optional.of(subscription));
        when(subscriptionMapper.entityToResponse(subscription))
                .thenReturn(response);

        assertSame(response, service.getById(id));
    }

    @Test
    void getById_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(subscriptionRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getById(id)
        );
    }

    @Test
    void getAll_ShouldMapAllSubscriptions() {
        Subscription s1 = new Subscription();
        Subscription s2 = new Subscription();

        when(subscriptionRepository.findAll())
                .thenReturn(List.of(s1, s2));
        when(subscriptionMapper.entityToResponse(any()))
                .thenReturn(mock(SubscriptionResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(subscriptionRepository.existsById(id)).thenReturn(true);

        service.delete(id);

        verify(subscriptionRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(subscriptionRepository.existsById(id)).thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.delete(id)
        );
    }

    @Test
    void creerPaiementSubscription_ShouldThrow_WhenUserMissing() {
        when(authentication.getName()).thenReturn("none@test.com");
        when(utilisateurRepository.findByEmail("none@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.creerPaiementSubscription(
                        abonnementId,
                        authentication
                )
        );
    }

    @Test
    void creerPaiementSubscription_ShouldThrow_WhenAbonnementInactive() {
        abonnement.setStatut(null);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));

        assertThrows(
                IllegalStateException.class,
                () -> service.creerPaiementSubscription(
                        abonnementId,
                        authentication
                )
        );
    }

    @Test
    void creerPaiementSubscription_ShouldThrow_WhenDurationInvalid() {
        abonnement.setDureeEnMois(0);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));

        assertThrows(
                IllegalStateException.class,
                () -> service.creerPaiementSubscription(
                        abonnementId,
                        authentication
                )
        );
    }

    @Test
    void creerPaiementSubscription_ShouldThrow_WhenAlreadySubscribed() {
        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));
        when(subscriptionRepository
                .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                        eq(utilisateur),
                        any(LocalDateTime.class)))
                .thenReturn(Optional.of(new Subscription()));

        assertThrows(
                IllegalStateException.class,
                () -> service.creerPaiementSubscription(
                        abonnementId,
                        authentication
                )
        );
    }

    @Test
    void creerPaiementSubscription_ShouldReturnStripeData_WhenSuccess() {
        Paiement paiement = new Paiement();
        paiement.setPaiementId(UUID.randomUUID());

        PaymentIntent paymentIntent = mock(PaymentIntent.class);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));
        when(subscriptionRepository
                .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                        eq(utilisateur),
                        any(LocalDateTime.class)))
                .thenReturn(Optional.empty());
        when(paiementRepository.save(any(Paiement.class)))
                .thenReturn(paiement);

        when(paymentIntent.getId()).thenReturn("pi_test");
        when(paymentIntent.getClientSecret()).thenReturn("secret");
        when(paymentIntent.getStatus()).thenReturn("requires_payment_method");

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() ->
                    PaymentIntent.create(
                            any(com.stripe.param.PaymentIntentCreateParams.class)
                    )
            ).thenReturn(paymentIntent);

            CreateSubscriptionResponseDto response =
                    service.creerPaiementSubscription(
                            abonnementId,
                            authentication
                    );

            assertEquals("pi_test", response.getPaymentIntentId());
            assertEquals("secret", response.getClientSecret());
            assertEquals(abonnementId, response.getAbonnementId());
        }
    }

    @Test
    void traiterPaiementSubscriptionReussi_ShouldReturn_WhenAlreadyProcessed() {
        Paiement paiement = new Paiement();
        paiement.setStatutPaiement(PaiementStatus.REUSSI);

        when(paiementRepository.findByStripePaymentIntentId("pi_test"))
                .thenReturn(Optional.of(paiement));

        service.traiterPaiementSubscriptionReussi("pi_test");

        verifyNoInteractions(
                utilisateurRepository,
                abonnementRepository,
                notificationService
        );
    }

    @Test
    void traiterPaiementSubscriptionReussi_ShouldThrow_WhenStripeNotSucceeded() {
        Paiement paiement = new Paiement();
        paiement.setStatutPaiement(PaiementStatus.EN_ATTENTE);

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("processing");

        when(paiementRepository.findByStripePaymentIntentId("pi_test"))
                .thenReturn(Optional.of(paiement));

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve("pi_test"))
                    .thenReturn(paymentIntent);

            assertThrows(
                    IllegalStateException.class,
                    () -> service.traiterPaiementSubscriptionReussi(
                            "pi_test"
                    )
            );
        }
    }

    @Test
    void traiterPaiementSubscriptionReussi_ShouldThrow_WhenMetadataMissing() {
        Paiement paiement = new Paiement();
        paiement.setStatutPaiement(PaiementStatus.EN_ATTENTE);

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getMetadata()).thenReturn(Map.of());

        when(paiementRepository.findByStripePaymentIntentId("pi_test"))
                .thenReturn(Optional.of(paiement));

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve("pi_test"))
                    .thenReturn(paymentIntent);

            assertThrows(
                    IllegalStateException.class,
                    () -> service.traiterPaiementSubscriptionReussi(
                            "pi_test"
                    )
            );
        }
    }

    @Test
    void traiterPaiementSubscriptionReussi_ShouldCreateSubscriptionAndFacturation() {
        String paymentIntentId = "pi_success";

        Paiement paiement = new Paiement();
        paiement.setPaiementId(UUID.randomUUID());
        paiement.setStatutPaiement(PaiementStatus.EN_ATTENTE);

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getMetadata()).thenReturn(Map.of(
                "utilisateurId", userId.toString(),
                "abonnementId", abonnementId.toString()
        ));

        when(paiementRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(paiement));
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));
        when(subscriptionRepository
                .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                        eq(utilisateur),
                        any(LocalDateTime.class)))
                .thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(Subscription.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(facturationRepository.save(any(Facturation.class)))
                .thenAnswer(i -> i.getArgument(0));

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve(paymentIntentId))
                    .thenReturn(paymentIntent);

            service.traiterPaiementSubscriptionReussi(paymentIntentId);

            assertEquals(PaiementStatus.REUSSI, paiement.getStatutPaiement());
            verify(subscriptionRepository, atLeastOnce())
                    .save(any(Subscription.class));
            verify(facturationRepository)
                    .save(any(Facturation.class));
            verify(notificationService)
                    .notifierPaiementConfirme(utilisateur);
        }
    }

    @Test
    void traiterPaiementSubscriptionEchec_ShouldStoreDefaultError_WhenStripeHasNoError() {
        Paiement paiement = new Paiement();
        PaymentIntent paymentIntent = mock(PaymentIntent.class);

        when(paiementRepository.findByStripePaymentIntentId("pi_failed"))
                .thenReturn(Optional.of(paiement));
        when(paymentIntent.getLastPaymentError()).thenReturn(null);

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve("pi_failed"))
                    .thenReturn(paymentIntent);

            service.traiterPaiementSubscriptionEchec("pi_failed");

            assertEquals(PaiementStatus.ECHOUE, paiement.getStatutPaiement());
            assertEquals(
                    "Paiement Stripe échoué.",
                    paiement.getMessageErreur()
            );
            verify(paiementRepository).save(paiement);
        }
    }
}
