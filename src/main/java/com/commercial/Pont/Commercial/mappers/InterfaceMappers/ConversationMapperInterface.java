package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.models.Conversation;

public interface ConversationMapperInterface {

    /**
     * Convertir ConversationRequestDto vers Conversation
     */
    Conversation requestToEntity(
            ConversationRequestDto conversationRequestDto
    );

    /**
     * Convertir Conversation vers ConversationRequestDto
     */
    ConversationRequestDto entityToRequest(
            Conversation conversation
    );

    /**
     * Convertir Conversation vers ConversationResponseDto
     */
    ConversationResponseDto entityToResponse(
            Conversation conversation
    );

    /**
     * Convertir ConversationResponseDto vers Conversation
     */
    Conversation responseToEntity(
            ConversationResponseDto conversationResponseDto
    );
}
