package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface DocumentConversationServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    DocumentConversationResponseDto create(
            DocumentConversationRequestDto documentConversationRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    DocumentConversationResponseDto update(
            UUID documentConversationId,
            DocumentConversationRequestDto documentConversationRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    DocumentConversationResponseDto getById(
            UUID documentConversationId
    );

    @PreAuthorize("hasRole('ADMIN')")
    List<DocumentConversationResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID documentConversationId
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    DocumentConversationResponseDto addDocumentToConversation(
            UUID conversationId,
            MultipartFile file
    );

    // Récupérer tous les documents d'une conversation
    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    List<DocumentConversationResponseDto> getDocumentsByConversation(
            UUID conversationId
    );

    // Supprimer un document d'une conversation
    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    void deleteDocumentFromConversation(
            UUID conversationId,
            UUID documentConversationId
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    DocumentConversationResponseDto markAsRead(
            UUID documentConversationId,
            Authentication authentication
    );
}