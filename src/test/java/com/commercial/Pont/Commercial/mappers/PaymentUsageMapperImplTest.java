package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.PaymentUsageMapperImpl;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.models.PaymentUsage;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.PaiementRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentUsageMapperImplTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private PaiementRepository paiementRepository;

    @InjectMocks
    private PaymentUsageMapperImpl mapper;

    @Test
    void toEntity_ShouldMapNombreMessagesAchetes() {
        PaymentUsageRequestDto dto =
                mock(PaymentUsageRequestDto.class);

        when(dto.getNombreMessagesAchetes())
                .thenReturn(100);

        PaymentUsage result =
                mapper.toEntity(dto);

        assertNotNull(result);
        assertEquals(
                100,
                result.getNombreMessagesAchetes()
        );
    }

    @Test
    void toResponseDto_ShouldMapRelationsIds() {
        UUID utilisateurId = UUID.randomUUID();
        UUID facturationId = UUID.randomUUID();
        UUID paiementId = UUID.randomUUID();

        Utilisateur utilisateur =
                mock(Utilisateur.class);

        Facturation facturation =
                mock(Facturation.class);

        Paiement paiement =
                mock(Paiement.class);

        when(utilisateur.getUtilisateurId())
                .thenReturn(utilisateurId);

        when(facturation.getFacturationId())
                .thenReturn(facturationId);

        when(paiement.getPaiementId())
                .thenReturn(paiementId);

        PaymentUsage entity =
                mock(PaymentUsage.class);

        when(entity.getUtilisateur())
                .thenReturn(utilisateur);

        when(entity.getFacturation())
                .thenReturn(facturation);

        when(entity.getPaiement())
                .thenReturn(paiement);

        PaymentUsageResponseDto result =
                mapper.toResponseDto(entity);

        assertEquals(
                utilisateurId,
                result.getUtilisateurId()
        );

        assertEquals(
                facturationId,
                result.getFacturationId()
        );

        assertEquals(
                paiementId,
                result.getPaiementId()
        );
    }

    @Test
    void toResponseDto_WithoutRelations_ShouldReturnNullIds() {
        PaymentUsage entity =
                mock(PaymentUsage.class);

        PaymentUsageResponseDto result =
                mapper.toResponseDto(entity);

        assertNull(result.getUtilisateurId());
        assertNull(result.getFacturationId());
        assertNull(result.getPaiementId());
    }
}
