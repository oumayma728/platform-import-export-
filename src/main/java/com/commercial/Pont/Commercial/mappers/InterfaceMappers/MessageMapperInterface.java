package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.models.Message;

public interface MessageMapperInterface {

    /**
     * Convertir MessageRequestDto vers Message
     */
    Message requestToEntity(
            MessageRequestDto messageRequestDto
    );

    /**
     * Convertir Message vers MessageRequestDto
     */
    MessageRequestDto entityToRequest(
            Message message
    );

    /**
     * Convertir Message vers MessageResponseDto
     */
    MessageResponseDto entityToResponse(
            Message message
    );

    /**
     * Convertir MessageResponseDto vers Message
     */
    Message responseToEntity(
            MessageResponseDto messageResponseDto
    );
}
