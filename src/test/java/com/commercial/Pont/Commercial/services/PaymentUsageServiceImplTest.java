package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.config.BillingConfig;
import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageRecommendationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.enums.PaiementStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.PaymentUsageMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ImplementationServices.PaymentUsageServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import com.stripe.model.PaymentIntent;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class PaymentUsageServiceImplTest {

    @Mock private PaymentUsageRepository paymentUsageRepository;
    @Mock private PaymentUsageMapperInterface paymentUsageMapper;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private AbonnementRepository abonnementRepository;
    @Mock private PaiementRepository paiementRepository;
    @Mock private FacturationRepository facturationRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private BillingConfig billingConfig;
    @Mock private CurrencyConversionServiceInterface currencyConversionService;
    @Mock private NotificationServiceInterface notificationService;
    @Mock private Authentication authentication;

    @InjectMocks
    private PaymentUsageServiceImpl service;

    private UUID userId;
    private Utilisateur user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new Utilisateur();
        user.setUtilisateurId(userId);
        user.setMaxMessagesPossible(50);
    }

    @Test
    void updatePaymentUsage_ShouldUpdateSuccessfully() {
        UUID id = UUID.randomUUID();

        PaymentUsage existing = new PaymentUsage();
        PaymentUsage mapped = new PaymentUsage();

        Utilisateur mappedUser = new Utilisateur();
        mapped.setUtilisateur(mappedUser);
        mapped.setNombreMessagesAchetes(100);

        PaymentUsageRequestDto request =
                mock(PaymentUsageRequestDto.class);
        PaymentUsageResponseDto response =
                mock(PaymentUsageResponseDto.class);

        when(paymentUsageRepository.findById(id))
                .thenReturn(Optional.of(existing));
        when(paymentUsageMapper.toEntity(request))
                .thenReturn(mapped);
        when(paymentUsageRepository.save(existing))
                .thenReturn(existing);
        when(paymentUsageMapper.toResponseDto(existing))
                .thenReturn(response);

        assertSame(
                response,
                service.updatePaymentUsage(id, request)
        );

        assertSame(mappedUser, existing.getUtilisateur());
        assertEquals(100, existing.getNombreMessagesAchetes());
        assertNotNull(existing.getUpdatedAt());
    }

    @Test
    void updatePaymentUsage_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(paymentUsageRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.updatePaymentUsage(
                        id,
                        mock(PaymentUsageRequestDto.class)
                )
        );
    }

    @Test
    void deletePaymentUsage_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(paymentUsageRepository.existsById(id))
                .thenReturn(true);

        service.deletePaymentUsage(id);

        verify(paymentUsageRepository).deleteById(id);
    }

    @Test
    void deletePaymentUsage_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(paymentUsageRepository.existsById(id))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.deletePaymentUsage(id)
        );
    }

    @Test
    void recommanderAbonnement_ShouldThrow_WhenUserMissing() {
        when(authentication.getName()).thenReturn("none@test.com");
        when(utilisateurRepository.findByEmail("none@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.recommanderAbonnement(
                        mock(PaymentUsageRequestDto.class),
                        authentication
                )
        );
    }

    @Test
    void recommanderAbonnement_ShouldThrow_WhenMessagesNull() {
        PaymentUsageRequestDto request =
                mock(PaymentUsageRequestDto.class);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getNombreMessagesAchetes()).thenReturn(null);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.recommanderAbonnement(
                        request,
                        authentication
                )
        );
    }

    @Test
    void recommanderAbonnement_ShouldReturnNoRecommendation_WhenNoPlanIsCheaper() {
        PaymentUsageRequestDto request =
                mock(PaymentUsageRequestDto.class);

        Abonnement abonnement = new Abonnement();
        abonnement.setMontant(new BigDecimal("100"));
        abonnement.setDevise("MAD");

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getNombreMessagesAchetes()).thenReturn(10);
        when(billingConfig.getMessagePrice())
                .thenReturn(new BigDecimal("2"));
        when(billingConfig.getCurrency()).thenReturn("MAD");
        when(abonnementRepository.findByStatut(AbonnementStatus.ACTIVE))
                .thenReturn(List.of(abonnement));
        when(currencyConversionService.convertir(
                new BigDecimal("100"),
                "MAD",
                "MAD"))
                .thenReturn(new BigDecimal("100"));

        PaymentUsageRecommendationResponseDto result =
                service.recommanderAbonnement(
                        request,
                        authentication
                );

        assertFalse(result.isAbonnementRecommande());
        assertEquals(new BigDecimal("20"), result.getMontantMessages());
    }

    @Test
    void recommanderAbonnement_ShouldRecommendCheapestPlan() {
        PaymentUsageRequestDto request =
                mock(PaymentUsageRequestDto.class);

        Abonnement a1 = new Abonnement();
        a1.setAbonnementId(UUID.randomUUID());
        a1.setNom("Basic");
        a1.setMontant(new BigDecimal("10"));
        a1.setDevise("USD");

        Abonnement a2 = new Abonnement();
        a2.setAbonnementId(UUID.randomUUID());
        a2.setNom("Premium");
        a2.setMontant(new BigDecimal("15"));
        a2.setDevise("USD");

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getNombreMessagesAchetes()).thenReturn(20);
        when(billingConfig.getMessagePrice())
                .thenReturn(new BigDecimal("2"));
        when(billingConfig.getCurrency()).thenReturn("USD");
        when(abonnementRepository.findByStatut(AbonnementStatus.ACTIVE))
                .thenReturn(List.of(a1, a2));
        when(currencyConversionService.convertir(
                any(BigDecimal.class),
                eq("USD"),
                eq("USD")))
                .thenAnswer(i -> i.getArgument(0));

        PaymentUsageRecommendationResponseDto result =
                service.recommanderAbonnement(
                        request,
                        authentication
                );

        assertTrue(result.isAbonnementRecommande());
        assertEquals(a1.getAbonnementId(), result.getAbonnementId());
        assertEquals("Basic", result.getAbonnementNom());
    }

    @Test
    void recommanderAbonnement_ShouldIgnoreInvalidPlans() {
        PaymentUsageRequestDto request =
                mock(PaymentUsageRequestDto.class);

        Abonnement invalid = new Abonnement();
        invalid.setMontant(null);
        invalid.setDevise(null);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getNombreMessagesAchetes()).thenReturn(10);
        when(billingConfig.getMessagePrice())
                .thenReturn(new BigDecimal("2"));
        when(billingConfig.getCurrency()).thenReturn("MAD");
        when(abonnementRepository.findByStatut(AbonnementStatus.ACTIVE))
                .thenReturn(List.of(invalid));

        PaymentUsageRecommendationResponseDto result =
                service.recommanderAbonnement(
                        request,
                        authentication
                );

        assertFalse(result.isAbonnementRecommande());
        verifyNoInteractions(currencyConversionService);
    }

    @Test
    void creerPaiementPaymentUsage_ShouldThrow_WhenAlreadySubscribed() {
        PaymentUsageRequestDto request =
                mock(PaymentUsageRequestDto.class);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getNombreMessagesAchetes()).thenReturn(10);
        when(subscriptionRepository
                .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                        eq(user),
                        any(LocalDateTime.class)))
                .thenReturn(Optional.of(new Subscription()));

        assertThrows(
                IllegalStateException.class,
                () -> service.creerPaiementPaymentUsage(
                        request,
                        authentication
                )
        );
    }

    @Test
    void traiterPaiementUsageReussi_ShouldReturn_WhenAlreadyProcessed() {
        Paiement paiement = new Paiement();
        paiement.setStatutPaiement(PaiementStatus.REUSSI);

        when(paiementRepository.findByStripePaymentIntentId("pi_test"))
                .thenReturn(Optional.of(paiement));

        service.traiterPaiementUsageReussi("pi_test");

        verify(paymentUsageRepository, never())
                .save(any());
    }

    @Test
    void traiterPaiementUsageReussi_ShouldThrow_WhenStripeNotSucceeded() {
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
                    () -> service.traiterPaiementUsageReussi(
                            "pi_test"
                    )
            );
        }
    }

    @Test
    void traiterPaiementUsageReussi_ShouldThrow_WhenWrongType() {
        Paiement paiement = new Paiement();
        paiement.setStatutPaiement(PaiementStatus.EN_ATTENTE);

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getMetadata())
                .thenReturn(Map.of("type", "SUBSCRIPTION"));

        when(paiementRepository.findByStripePaymentIntentId("pi_test"))
                .thenReturn(Optional.of(paiement));

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve("pi_test"))
                    .thenReturn(paymentIntent);

            assertThrows(
                    IllegalStateException.class,
                    () -> service.traiterPaiementUsageReussi(
                            "pi_test"
                    )
            );
        }
    }

    @Test
    void traiterPaiementUsageReussi_ShouldReturn_WhenUsageAlreadyExists() {
        String paymentIntentId = "pi_test";
        Paiement paiement = new Paiement();
        paiement.setStatutPaiement(PaiementStatus.EN_ATTENTE);

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getMetadata()).thenReturn(Map.of(
                "type", "PAYMENT_USAGE",
                "utilisateurId", userId.toString(),
                "nombreMessagesAchetes", "10"
        ));

        when(paiementRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(paiement));
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(paymentUsageRepository
                .findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(new PaymentUsage()));

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve(paymentIntentId))
                    .thenReturn(paymentIntent);

            service.traiterPaiementUsageReussi(paymentIntentId);

            verify(paymentUsageRepository, never())
                    .save(any());
        }
    }

    @Test
    void traiterPaiementUsageReussi_ShouldCreateUsageAndIncreaseQuota() {
        String paymentIntentId = "pi_success";

        Paiement paiement = new Paiement();
        paiement.setMontant(new BigDecimal("20"));
        paiement.setDevise("MAD");
        paiement.setStatutPaiement(PaiementStatus.EN_ATTENTE);

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getMetadata()).thenReturn(Map.of(
                "type", "PAYMENT_USAGE",
                "utilisateurId", userId.toString(),
                "nombreMessagesAchetes", "25"
        ));

        when(paiementRepository.findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.of(paiement));
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(paymentUsageRepository
                .findByStripePaymentIntentId(paymentIntentId))
                .thenReturn(Optional.empty());
        when(paymentUsageRepository.save(any(PaymentUsage.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(facturationRepository.save(any(Facturation.class)))
                .thenAnswer(i -> i.getArgument(0));

        try (MockedStatic<PaymentIntent> mocked =
                     mockStatic(PaymentIntent.class)) {

            mocked.when(() -> PaymentIntent.retrieve(paymentIntentId))
                    .thenReturn(paymentIntent);

            service.traiterPaiementUsageReussi(paymentIntentId);

            assertEquals(75, user.getMaxMessagesPossible());
            assertEquals(PaiementStatus.REUSSI, paiement.getStatutPaiement());

            verify(paymentUsageRepository, atLeastOnce())
                    .save(any(PaymentUsage.class));
            verify(facturationRepository)
                    .save(any(Facturation.class));
            verify(notificationService)
                    .notifierPaiementConfirme(user);
        }
    }

    @Test
    void getPaymentUsageById_ShouldReturnMappedUsage() {
        UUID id = UUID.randomUUID();
        PaymentUsage usage = new PaymentUsage();
        PaymentUsageResponseDto dto =
                mock(PaymentUsageResponseDto.class);

        when(paymentUsageRepository.findById(id))
                .thenReturn(Optional.of(usage));
        when(paymentUsageMapper.toResponseDto(usage))
                .thenReturn(dto);

        assertSame(dto, service.getPaymentUsageById(id));
    }

    @Test
    void getPaymentUsageById_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(paymentUsageRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getPaymentUsageById(id)
        );
    }

    @Test
    void getAllPaymentUsages_ShouldMapAll() {
        PaymentUsage u1 = new PaymentUsage();
        PaymentUsage u2 = new PaymentUsage();

        when(paymentUsageRepository.findAll())
                .thenReturn(List.of(u1, u2));
        when(paymentUsageMapper.toResponseDto(any()))
                .thenReturn(mock(PaymentUsageResponseDto.class));

        assertEquals(2, service.getAllPaymentUsages().size());
    }

    @Test
    void getPaymentUsagesByUtilisateur_ShouldMapAll() {
        PaymentUsage usage = new PaymentUsage();

        when(paymentUsageRepository
                .findByUtilisateurUtilisateurId(userId))
                .thenReturn(List.of(usage));
        when(paymentUsageMapper.toResponseDto(usage))
                .thenReturn(mock(PaymentUsageResponseDto.class));

        assertEquals(
                1,
                service.getPaymentUsagesByUtilisateur(userId).size()
        );
    }
}
