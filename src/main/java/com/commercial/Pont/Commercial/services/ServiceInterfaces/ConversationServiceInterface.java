package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;

import java.util.List;
import java.util.UUID;

public interface ConversationServiceInterface {

    ConversationResponseDto create(
            ConversationRequestDto conversationRequestDto
    );

    ConversationResponseDto update(
            UUID conversationId,
            ConversationRequestDto conversationRequestDto
    );

    ConversationResponseDto getById(
            UUID conversationId
    );

    List<ConversationResponseDto> getAll();

    void delete(
            UUID conversationId
    );
}