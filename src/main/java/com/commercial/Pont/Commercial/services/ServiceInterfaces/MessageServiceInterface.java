package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;

import java.util.List;
import java.util.UUID;

public interface MessageServiceInterface {

    MessageResponseDto create(
            MessageRequestDto messageRequestDto
    );

    MessageResponseDto update(
            UUID messageId,
            MessageRequestDto messageRequestDto
    );

    MessageResponseDto getById(
            UUID messageId
    );

    List<MessageResponseDto> getAll();

    void delete(
            UUID messageId
    );


    List<MessageResponseDto> getByConversationId(
            UUID conversationId
    );
}