package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.models.Notification;

public interface NotificationMapperInterface {

    /**
     * Convertir NotificationRequestDto vers Notification
     */
    Notification requestToEntity(
            NotificationRequestDto notificationRequestDto
    );

    /**
     * Convertir Notification vers NotificationRequestDto
     */
    NotificationRequestDto entityToRequest(
            Notification notification
    );

    /**
     * Convertir Notification vers NotificationResponseDto
     */
    NotificationResponseDto entityToResponse(
            Notification notification
    );

    /**
     * Convertir NotificationResponseDto vers Notification
     */
    Notification responseToEntity(
            NotificationResponseDto notificationResponseDto
    );
}