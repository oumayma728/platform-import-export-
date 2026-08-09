package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.models.Subscription;

public interface SubscriptionMapperInterface {

    /**
     * Convertir SubscriptionRequestDto vers Subscription
     */
    Subscription requestToEntity(
            SubscriptionRequestDto subscriptionRequestDto
    );

    /**
     * Convertir Subscription vers SubscriptionRequestDto
     */
    SubscriptionRequestDto entityToRequest(
            Subscription subscription
    );

    /**
     * Convertir Subscription vers SubscriptionResponseDto
     */
    SubscriptionResponseDto entityToResponse(
            Subscription subscription
    );

    /**
     * Convertir SubscriptionResponseDto vers Subscription
     */
    Subscription responseToEntity(
            SubscriptionResponseDto subscriptionResponseDto
    );
}