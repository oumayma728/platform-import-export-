package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreatePaymentUsageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageRecommendationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface PaymentUsageServiceInterface {

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    PaymentUsageResponseDto getPaymentUsageById(
            UUID paymentUsageId

    );

    @PreAuthorize("hasRole('ADMIN')")
    List<PaymentUsageResponseDto> getAllPaymentUsages();

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<PaymentUsageResponseDto> getPaymentUsagesByUtilisateur(
            UUID utilisateurId
    );

    @PreAuthorize("hasRole('ADMIN')")
    PaymentUsageResponseDto updatePaymentUsage(
            UUID paymentUsageId,
            PaymentUsageRequestDto requestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    void deletePaymentUsage(
            UUID paymentUsageId
    );






    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    PaymentUsageRecommendationResponseDto
    recommanderAbonnement(
            PaymentUsageRequestDto requestDto,
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    CreatePaymentUsageResponseDto
    creerPaiementPaymentUsage(
            PaymentUsageRequestDto requestDto,
            Authentication authentication
    );


    void traiterPaiementUsageReussi(
            String paymentIntentId
    );

}