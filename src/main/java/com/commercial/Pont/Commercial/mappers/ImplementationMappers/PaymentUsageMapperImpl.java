package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.PaymentUsageMapperInterface;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.models.PaymentUsage;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.PaiementRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentUsageMapperImpl
        implements PaymentUsageMapperInterface {

    private final UtilisateurRepository utilisateurRepository;
    private final PaiementRepository paiementRepository;

    @Override
    public PaymentUsage toEntity(
            PaymentUsageRequestDto dto
    ) {

        return PaymentUsage.builder()
                .nombreMessagesAchetes(
                        dto.getNombreMessagesAchetes()
                )
                .build();
    }


    @Override
    public PaymentUsageResponseDto toResponseDto(
            PaymentUsage entity
    ) {

        return PaymentUsageResponseDto.builder()

                .paymentUsageId(
                        entity.getPaymentUsageId()
                )

                .utilisateurId(
                        entity.getUtilisateur() != null
                                ? entity.getUtilisateur()
                                .getUtilisateurId()
                                : null
                )

                .facturationId(
                        entity.getFacturation() != null
                                ? entity.getFacturation()
                                .getFacturationId()
                                : null
                )
                .paiementId(
                        entity.getPaiement() != null
                                ? entity.getPaiement()
                                .getPaiementId()
                                : null
                )

                .nombreMessagesAchetes(
                        entity.getNombreMessagesAchetes()
                )

                .montant(
                        entity.getMontant()
                )

                .devise(
                        entity.getDevise()
                )

                .dateAchat(
                        entity.getDateAchat()
                )

                .dateExpiration(
                        entity.getDateExpiration()
                )

                .createdAt(
                        entity.getCreatedAt()
                )

                .updatedAt(
                        entity.getUpdatedAt()
                )

                .build();
    }
}