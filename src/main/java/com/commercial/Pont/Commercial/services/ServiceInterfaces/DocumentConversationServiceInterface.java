package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;

import java.util.List;
import java.util.UUID;

public interface DocumentConversationServiceInterface {

    DocumentConversationResponseDto create(
            DocumentConversationRequestDto documentConversationRequestDto
    );

    DocumentConversationResponseDto update(
            UUID documentConversationId,
            DocumentConversationRequestDto documentConversationRequestDto
    );

    DocumentConversationResponseDto getById(
            UUID documentConversationId
    );

    List<DocumentConversationResponseDto> getAll();

    void delete(
            UUID documentConversationId
    );
}