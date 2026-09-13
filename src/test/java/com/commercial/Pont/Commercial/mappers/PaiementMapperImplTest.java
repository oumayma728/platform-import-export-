package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.PaiementMapperImpl;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.models.PaymentUsage;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.PaymentUsageRepository;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
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
class PaiementMapperImplTest {

    @Mock
    private FacturationRepository facturationRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PaymentUsageRepository paymentUsageRepository;

    @InjectMocks
    private PaiementMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldCreatePaiement() {
        PaiementRequestDto dto = mock(PaiementRequestDto.class);

        Paiement result = mapper.requestToEntity(dto);

        assertNotNull(result);
    }

    @Test
    void entityToResponse_ShouldExtractSubscriptionAndPaymentUsageIds() {
        UUID subscriptionId = UUID.randomUUID();
        UUID paymentUsageId = UUID.randomUUID();

        Subscription subscription = mock(Subscription.class);
        PaymentUsage paymentUsage = mock(PaymentUsage.class);

        when(subscription.getSubscriptionId())
                .thenReturn(subscriptionId);

        when(paymentUsage.getPaymentUsageId())
                .thenReturn(paymentUsageId);

        Paiement paiement = mock(Paiement.class);

        when(paiement.getSubscription())
                .thenReturn(subscription);

        when(paiement.getPaymentUsage())
                .thenReturn(paymentUsage);

        PaiementResponseDto response =
                mapper.entityToResponse(paiement);

        assertEquals(
                subscriptionId,
                response.getSubscriptionId()
        );

        assertEquals(
                paymentUsageId,
                response.getPaymentUsageId()
        );
    }

    @Test
    void entityToResponse_WithoutRelations_ShouldReturnNullIds() {
        Paiement paiement = mock(Paiement.class);

        PaiementResponseDto response =
                mapper.entityToResponse(paiement);

        assertNull(response.getSubscriptionId());
        assertNull(response.getPaymentUsageId());
    }

    @Test
    void entityToRequest_ShouldReturnDto() {
        Paiement paiement = mock(Paiement.class);

        PaiementRequestDto request =
                mapper.entityToRequest(paiement);

        assertNotNull(request);
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID subscriptionId = UUID.randomUUID();
        UUID paymentUsageId = UUID.randomUUID();

        Subscription subscription = mock(Subscription.class);
        PaymentUsage paymentUsage = mock(PaymentUsage.class);

        PaiementResponseDto dto =
                mock(PaiementResponseDto.class);

        when(dto.getSubscriptionId())
                .thenReturn(subscriptionId);

        when(dto.getPaymentUsageId())
                .thenReturn(paymentUsageId);

        when(subscriptionRepository.findById(subscriptionId))
                .thenReturn(Optional.of(subscription));

        when(paymentUsageRepository.findById(paymentUsageId))
                .thenReturn(Optional.of(paymentUsage));

        Paiement result =
                mapper.responseToEntity(dto);

        assertNotNull(result);
        assertSame(subscription, result.getSubscription());
        assertSame(paymentUsage, result.getPaymentUsage());
    }

    @Test
    void responseToEntity_WithoutRelations_ShouldLeaveRelationsNull() {
        PaiementResponseDto dto =
                mock(PaiementResponseDto.class);

        Paiement result =
                mapper.responseToEntity(dto);

        assertNull(result.getSubscription());
        assertNull(result.getPaymentUsage());

        verifyNoInteractions(
                subscriptionRepository,
                paymentUsageRepository
        );
    }
}
