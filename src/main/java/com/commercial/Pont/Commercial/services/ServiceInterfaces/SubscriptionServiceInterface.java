package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;

import java.util.List;
import java.util.UUID;

public interface SubscriptionServiceInterface {

    SubscriptionResponseDto create(
            SubscriptionRequestDto subscriptionRequestDto
    );

    SubscriptionResponseDto update(
            UUID subscriptionId,
            SubscriptionRequestDto subscriptionRequestDto
    );

    SubscriptionResponseDto getById(
            UUID subscriptionId
    );

    List<SubscriptionResponseDto> getAll();

    void delete(
            UUID subscriptionId
    );
}