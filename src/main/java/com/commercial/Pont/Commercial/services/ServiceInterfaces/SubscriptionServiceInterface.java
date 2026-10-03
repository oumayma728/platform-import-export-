package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreateSubscriptionResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.security.core.Authentication;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface SubscriptionServiceInterface {
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    SubscriptionResponseDto create(
            SubscriptionRequestDto subscriptionRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    SubscriptionResponseDto update(
            UUID subscriptionId,
            SubscriptionRequestDto subscriptionRequestDto
    );
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    SubscriptionResponseDto getById(
            UUID subscriptionId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<SubscriptionResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID subscriptionId
    );


    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    CreateSubscriptionResponseDto
    creerPaiementSubscription(
            UUID abonnementId,
            Authentication authentication
    );


    void traiterPaiementSubscriptionReussi(
            String paymentIntentId
    );


    void traiterPaiementSubscriptionEchec(
            String paymentIntentId
    );

}