package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.FacturationMapperImpl;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
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
class FacturationMapperImplTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private PaiementRepository paiementRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private PaymentUsageRepository paymentUsageRepository;

    @InjectMocks
    private FacturationMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID subscriptionId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID paymentUsageId = UUID.randomUUID();

        Subscription subscription = mock(Subscription.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        PaymentUsage paymentUsage = mock(PaymentUsage.class);

        FacturationRequestDto dto = mock(FacturationRequestDto.class);
        when(dto.getSubscriptionId()).thenReturn(subscriptionId);
        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getPaymentUsageId()).thenReturn(paymentUsageId);

        when(subscriptionRepository.findById(subscriptionId)).thenReturn(Optional.of(subscription));
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));
        when(paymentUsageRepository.findById(paymentUsageId)).thenReturn(Optional.of(paymentUsage));

        Facturation result = mapper.requestToEntity(dto);

        assertSame(subscription, result.getSubscription());
        assertSame(utilisateur, result.getUtilisateur());
        assertSame(paymentUsage, result.getPaymentUsage());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldLeaveRelationsNull() {
        FacturationRequestDto dto = mock(FacturationRequestDto.class);

        Facturation result = mapper.requestToEntity(dto);

        assertNull(result.getSubscription());
        assertNull(result.getUtilisateur());
        assertNull(result.getPaymentUsage());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID subscriptionId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID paymentUsageId = UUID.randomUUID();

        Subscription subscription = mock(Subscription.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        PaymentUsage paymentUsage = mock(PaymentUsage.class);

        when(subscription.getSubscriptionId()).thenReturn(subscriptionId);
        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);
        when(paymentUsage.getPaymentUsageId()).thenReturn(paymentUsageId);

        Facturation facturation = mock(Facturation.class);
        when(facturation.getSubscription()).thenReturn(subscription);
        when(facturation.getUtilisateur()).thenReturn(utilisateur);
        when(facturation.getPaymentUsage()).thenReturn(paymentUsage);

        FacturationRequestDto request = mapper.entityToRequest(facturation);
        FacturationResponseDto response = mapper.entityToResponse(facturation);

        assertEquals(subscriptionId, request.getSubscriptionId());
        assertEquals(utilisateurId, request.getUtilisateurId());
        assertEquals(paymentUsageId, request.getPaymentUsageId());

        assertEquals(subscriptionId, response.getSubscriptionId());
        assertEquals(utilisateurId, response.getUtilisateurId());
        assertEquals(paymentUsageId, response.getPaymentUsageId());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID subscriptionId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID paymentUsageId = UUID.randomUUID();

        Subscription subscription = mock(Subscription.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        PaymentUsage paymentUsage = mock(PaymentUsage.class);

        FacturationResponseDto dto = mock(FacturationResponseDto.class);
        when(dto.getSubscriptionId()).thenReturn(subscriptionId);
        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getPaymentUsageId()).thenReturn(paymentUsageId);

        when(subscriptionRepository.findById(subscriptionId)).thenReturn(Optional.of(subscription));
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));
        when(paymentUsageRepository.findById(paymentUsageId)).thenReturn(Optional.of(paymentUsage));

        Facturation result = mapper.responseToEntity(dto);

        assertSame(subscription, result.getSubscription());
        assertSame(utilisateur, result.getUtilisateur());
        assertSame(paymentUsage, result.getPaymentUsage());
    }
}
