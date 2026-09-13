package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.SubscriptionMapperImpl;
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
class SubscriptionMapperImplTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private AbonnementRepository abonnementRepository;
    @Mock private FacturationRepository facturationRepository;
    @Mock private PaiementRepository paiementRepository;

    @InjectMocks
    private SubscriptionMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveAllRelations() {
        UUID utilisateurId = UUID.randomUUID();
        UUID abonnementId = UUID.randomUUID();
        UUID facturationId = UUID.randomUUID();
        UUID paiementId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        Abonnement abonnement = mock(Abonnement.class);
        Facturation facturation = mock(Facturation.class);
        Paiement paiement = mock(Paiement.class);

        SubscriptionRequestDto dto =
                mock(SubscriptionRequestDto.class);

        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getAbonnementId()).thenReturn(abonnementId);
        when(dto.getFacturationId()).thenReturn(facturationId);
        when(dto.getPaiementId()).thenReturn(paiementId);

        when(utilisateurRepository.findById(utilisateurId))
                .thenReturn(Optional.of(utilisateur));

        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));

        when(facturationRepository.findById(facturationId))
                .thenReturn(Optional.of(facturation));

        when(paiementRepository.findById(paiementId))
                .thenReturn(Optional.of(paiement));

        Subscription result =
                mapper.requestToEntity(dto);

        assertSame(utilisateur, result.getUtilisateur());
        assertSame(abonnement, result.getAbonnement());
        assertSame(facturation, result.getFacturation());
        assertSame(paiement, result.getPaiement());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldLeaveRelationsNull() {
        SubscriptionRequestDto dto =
                mock(SubscriptionRequestDto.class);

        Subscription result =
                mapper.requestToEntity(dto);

        assertNull(result.getUtilisateur());
        assertNull(result.getAbonnement());
        assertNull(result.getFacturation());
        assertNull(result.getPaiement());
    }

    @Test
    void entityToDtos_ShouldExtractAllRelationIds() {
        UUID utilisateurId = UUID.randomUUID();
        UUID abonnementId = UUID.randomUUID();
        UUID facturationId = UUID.randomUUID();
        UUID paiementId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        Abonnement abonnement = mock(Abonnement.class);
        Facturation facturation = mock(Facturation.class);
        Paiement paiement = mock(Paiement.class);

        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);
        when(abonnement.getAbonnementId()).thenReturn(abonnementId);
        when(facturation.getFacturationId()).thenReturn(facturationId);
        when(paiement.getPaiementId()).thenReturn(paiementId);

        Subscription subscription =
                mock(Subscription.class);

        when(subscription.getUtilisateur()).thenReturn(utilisateur);
        when(subscription.getAbonnement()).thenReturn(abonnement);
        when(subscription.getFacturation()).thenReturn(facturation);
        when(subscription.getPaiement()).thenReturn(paiement);

        SubscriptionRequestDto request =
                mapper.entityToRequest(subscription);

        SubscriptionResponseDto response =
                mapper.entityToResponse(subscription);

        assertEquals(utilisateurId, request.getUtilisateurId());
        assertEquals(abonnementId, request.getAbonnementId());
        assertEquals(facturationId, request.getFacturationId());
        assertEquals(paiementId, request.getPaiementId());

        assertEquals(utilisateurId, response.getUtilisateurId());
        assertEquals(abonnementId, response.getAbonnementId());
        assertEquals(facturationId, response.getFacturationId());
        assertEquals(paiementId, response.getPaiementId());
    }

    @Test
    void responseToEntity_ShouldResolveAllRelations() {
        UUID utilisateurId = UUID.randomUUID();
        UUID abonnementId = UUID.randomUUID();
        UUID facturationId = UUID.randomUUID();
        UUID paiementId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        Abonnement abonnement = mock(Abonnement.class);
        Facturation facturation = mock(Facturation.class);
        Paiement paiement = mock(Paiement.class);

        SubscriptionResponseDto dto =
                mock(SubscriptionResponseDto.class);

        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getAbonnementId()).thenReturn(abonnementId);
        when(dto.getFacturationId()).thenReturn(facturationId);
        when(dto.getPaiementId()).thenReturn(paiementId);

        when(utilisateurRepository.findById(utilisateurId))
                .thenReturn(Optional.of(utilisateur));

        when(abonnementRepository.findById(abonnementId))
                .thenReturn(Optional.of(abonnement));

        when(facturationRepository.findById(facturationId))
                .thenReturn(Optional.of(facturation));

        when(paiementRepository.findById(paiementId))
                .thenReturn(Optional.of(paiement));

        Subscription result =
                mapper.responseToEntity(dto);

        assertSame(utilisateur, result.getUtilisateur());
        assertSame(abonnement, result.getAbonnement());
        assertSame(facturation, result.getFacturation());
        assertSame(paiement, result.getPaiement());
    }
}
