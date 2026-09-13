package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.AbonnementMapperImpl;
import com.commercial.Pont.Commercial.models.Abonnement;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AbonnementMapperImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private AbonnementMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldMapSubscriptions() {
        UUID subscriptionId = UUID.randomUUID();
        Subscription subscription = mock(Subscription.class);
        AbonnementRequestDto dto = mock(AbonnementRequestDto.class);

        when(dto.getSubscriptionIds()).thenReturn(List.of(subscriptionId));
        when(subscriptionRepository.findAllById(List.of(subscriptionId)))
                .thenReturn(List.of(subscription));

        Abonnement result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertEquals(List.of(subscription), result.getSubscriptions());
        verify(subscriptionRepository).findAllById(List.of(subscriptionId));
    }

    @Test
    void requestToEntity_WithoutSubscriptions_ShouldUseEmptyList() {
        AbonnementRequestDto dto = mock(AbonnementRequestDto.class);
        when(dto.getSubscriptionIds()).thenReturn(null);

        Abonnement result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertNotNull(result.getSubscriptions());
        assertTrue(result.getSubscriptions().isEmpty());
        verifyNoInteractions(subscriptionRepository);
    }

    @Test
    void entityToDtos_ShouldExtractSubscriptionIds() {
        UUID id = UUID.randomUUID();
        Subscription subscription = mock(Subscription.class);
        when(subscription.getSubscriptionId()).thenReturn(id);

        Abonnement abonnement = mock(Abonnement.class);
        when(abonnement.getSubscriptions()).thenReturn(List.of(subscription));

        AbonnementRequestDto request = mapper.entityToRequest(abonnement);
        AbonnementResponseDto response = mapper.entityToResponse(abonnement);

        assertEquals(List.of(id), request.getSubscriptionIds());
        assertEquals(List.of(id), response.getSubscriptionIds());
    }

    @Test
    void responseToEntity_ShouldMapSubscriptions() {
        UUID id = UUID.randomUUID();
        Subscription subscription = mock(Subscription.class);
        AbonnementResponseDto dto = mock(AbonnementResponseDto.class);

        when(dto.getSubscriptionIds()).thenReturn(List.of(id));
        when(subscriptionRepository.findAllById(List.of(id)))
                .thenReturn(List.of(subscription));

        Abonnement result = mapper.responseToEntity(dto);

        assertNotNull(result);
        assertEquals(List.of(subscription), result.getSubscriptions());
    }
}
