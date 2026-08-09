package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;

import java.util.List;
import java.util.UUID;

public interface NotificationServiceInterface {

    NotificationResponseDto create(
            NotificationRequestDto notificationRequestDto
    );

    NotificationResponseDto update(
            UUID notificationId,
            NotificationRequestDto notificationRequestDto
    );

    NotificationResponseDto getById(
            UUID notificationId
    );

    List<NotificationResponseDto> getAll();

    void delete(
            UUID notificationId
    );
}