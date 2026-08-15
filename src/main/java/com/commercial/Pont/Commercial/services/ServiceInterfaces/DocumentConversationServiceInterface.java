package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import org.springframework.web.multipart.MultipartFile;

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

    DocumentConversationResponseDto addDocumentToConversation(
            UUID conversationId,
            MultipartFile file
    );

    // Récupérer tous les documents d'une conversation
    List<DocumentConversationResponseDto> getDocumentsByConversation(
            UUID conversationId
    );

    // Supprimer un document d'une conversation
    void deleteDocumentFromConversation(
            UUID conversationId,
            UUID documentConversationId
    );
}