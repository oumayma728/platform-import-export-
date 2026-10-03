package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.ConversationStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface ConversationServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    ConversationResponseDto create(
            ConversationRequestDto conversationRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    ConversationResponseDto update(
            UUID conversationId,
            ConversationRequestDto conversationRequestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    ConversationResponseDto getById(
            UUID conversationId
    );

    @PreAuthorize("hasRole('ADMIN')")
    List<ConversationResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID conversationId
    );


    @PreAuthorize("hasRole('ADMIN')")
    ConversationResponseDto updateStatus(
            UUID conversationId,
            ConversationStatus status
    );


    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    ConversationResponseDto createMyConversation(
            CreateConversationRequestDto request,
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    List<ConversationResponseDto> getMyConversations(
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    List<MessageResponseDto> getMessages(
            UUID conversationId,
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    ConversationResponseDto updateStatus(
            UUID conversationId,
            ConversationStatus statut,
            Authentication authentication
  );
}