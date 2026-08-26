package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreatePaymentUsageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageRecommendationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface PaymentUsageServiceInterface {


    PaymentUsageResponseDto getPaymentUsageById(
            UUID paymentUsageId
    );

    List<PaymentUsageResponseDto> getAllPaymentUsages();

    List<PaymentUsageResponseDto> getPaymentUsagesByUtilisateur(
            UUID utilisateurId
    );

    PaymentUsageResponseDto updatePaymentUsage(
            UUID paymentUsageId,
            PaymentUsageRequestDto requestDto
    );

    void deletePaymentUsage(
            UUID paymentUsageId
    );







    PaymentUsageRecommendationResponseDto
    recommanderAbonnement(
            PaymentUsageRequestDto requestDto,
            Authentication authentication
    );


    CreatePaymentUsageResponseDto
    creerPaiementPaymentUsage(
            PaymentUsageRequestDto requestDto,
            Authentication authentication
    );


    void traiterPaiementUsageReussi(
            String paymentIntentId
    );

}