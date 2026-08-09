package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.models.DocumentConversation;

public interface DocumentConversationMapperInterface {

    /**
     * Convertir DocumentConversationRequestDto vers DocumentConversation
     */
    DocumentConversation requestToEntity(
            DocumentConversationRequestDto documentConversationRequestDto
    );

    /**
     * Convertir DocumentConversation vers DocumentConversationRequestDto
     */
    DocumentConversationRequestDto entityToRequest(
            DocumentConversation documentConversation
    );

    /**
     * Convertir DocumentConversation vers DocumentConversationResponseDto
     */
    DocumentConversationResponseDto entityToResponse(
            DocumentConversation documentConversation
    );

    /**
     * Convertir DocumentConversationResponseDto vers DocumentConversation
     */
    DocumentConversation responseToEntity(
            DocumentConversationResponseDto documentConversationResponseDto
    );
}
